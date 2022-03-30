import EventEmitter from "../../events/event_emitter";
import Utils from "../../utils";

import MyWorker from "worker-loader!../../workers/worker";

class ComputedStateMessenger {
  constructor({ $global, chart, worker }) {
    this.$global = $global;
    this.chart = chart;
    this.worker = worker;

    this.isRequestingToGenerateAllInstructions = false;
    this.isGeneratingAllInstrutions = false;
  }

  addPixelInstructionsOffset({ newRange, oldRange }) {
    const { width, height } =
      this.$global.layout.chartDimensions[this.chart.id].main;

    this.worker.postMessage({
      type: "runComputedStateMethod",
      data: {
        chartId: this.chart.id,
        method: "addPixelInstructionsOffset",
        params: { newRange, oldRange, width, height },
      },
    });
  }

  async addToQueue({ indicator }) {
    const { renderingQueueId } = await new Promise((resolve) => {
      const id = this.$global.workers.addToResolveQueue(resolve);

      this.worker.postMessage({
        type: "runComputedStateMethod",
        data: {
          method: "addToQueue",
          resolveId: id,
          chartId: this.chart.id,
          params: { indicator },
        },
      });
    });

    const { canvas } = this.chart.subcharts.main;
    canvas.RE.addToRenderingOrder(renderingQueueId);

    return { renderingQueueId };
  }

  async setVisibility({ renderingQueueId, visible }) {
    await new Promise((resolve) => {
      const id = this.$global.workers.addToResolveQueue(resolve);

      this.worker.postMessage({
        type: "runComputedStateMethod",
        data: {
          method: "setVisibility",
          resolveId: id,
          chartId: this.chart.id,
          params: { renderingQueueId, visible },
        },
      });
    });

    await this.generateAllInstructions();
  }

  async calculateOneSet({ renderingQueueId, timestamps, dataset }) {
    await new Promise((resolve) => {
      const id = this.$global.workers.addToResolveQueue(resolve);

      this.worker.postMessage({
        type: "runComputedStateMethod",
        data: {
          method: "calculateOneSet",
          resolveId: id,
          chartId: this.chart.id,
          params: {
            renderingQueueId,
            timestamps,
            dataset,
          },
        },
      });
    });

    // Generate instructions for this set
    await this.generateAllInstructions();
  }

  async generateInstructions({ renderingQueueId, timestamps }) {
    const { instructions } = await new Promise((resolve) => {
      const id = this.$global.workers.addToResolveQueue(resolve);

      const chartDimensions =
        this.$global.layout.chartDimensions[this.chart.id];

      this.worker.postMessage({
        type: "runComputedStateMethod",
        data: {
          method: "generateInstructions",
          resolveId: id,
          chartId: this.chart.id,
          params: {
            renderingQueueId,
            timestamps,
            scaleType: this.chart.settings.scaleType,
            visibleRange: this.chart.range,
            timeframe: this.chart.timeframe,
            chartDimensions: {
              main: chartDimensions.main,
              yScale: chartDimensions.yScale,
              xScale: chartDimensions.xScale,
            },
            pixelsPerElement: this.chart.pixelsPerElement,
            settings: this.chart.settings,
          },
        },
      });
    });

    // Set instructions to respective chart rendering engines
    const { RE } = this.chart.subcharts.main.canvas;
    if (!RE.instructions[renderingQueueId]) {
      RE.instructions[renderingQueueId] = {};
    }
    Object.assign(RE.instructions[renderingQueueId], instructions.main);
  }

  async generateAllInstructions() {
    // If already generating instructions, dont fill the call stack with useless calls
    if (this.isGeneratingAllInstrutions) {
      this.isRequestingToGenerateAllInstructions = true;
      return { throwback: true };
    }

    this.isGeneratingAllInstrutions = true;

    const { instructions, visibleRanges, pixelsPerElement, maxDecimalPlaces } =
      await new Promise((resolve) => {
        const id = this.$global.workers.addToResolveQueue(resolve);

        const chartDimensions =
          this.$global.layout.chartDimensions[this.chart.id];

        this.worker.postMessage({
          type: "runComputedStateMethod",
          data: {
            method: "generateAllInstructions",
            resolveId: id,
            chartId: this.chart.id,
            params: {
              scaleType: this.chart.settings.scaleType,
              requestedRange: this.chart.range,
              timeframe: this.chart.timeframe,
              chartDimensions: {
                main: chartDimensions.main,
                yScale: chartDimensions.yScale,
                xScale: chartDimensions.xScale,
              },
              pixelsPerElement: this.chart.pixelsPerElement,
              settings: this.chart.settings,
            },
          },
        });
      });

    this.chart.onGenerateAllInstructions({
      instructions,
      visibleRanges,
      pixelsPerElement,
      maxDecimalPlaces,
    });
    this.isGeneratingAllInstrutions = false;

    // If another generation is requested, call again
    if (this.isRequestingToGenerateAllInstructions) {
      this.isRequestingToGenerateAllInstructions = false;
      setTimeout(() => this.generateAllInstructions());
    }
  }

  emptyAllSets() {
    this.worker.postMessage({
      type: "runComputedStateMethod",
      data: {
        method: "emptyAllSets",
        chartId: this.chart.id,
        params: {},
      },
    });
  }

  removeFromQueue({ renderingQueueId }) {
    this.worker.postMessage({
      type: "runComputedStateMethod",
      data: {
        method: "removeFromQueue",
        chartId: this.chart.id,
        params: { renderingQueueId },
      },
    });

    const { canvas } = this.chart.subcharts.main;
    canvas.RE.removeFromRenderingOrder(renderingQueueId);
  }
}

export default class WorkerState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.workersSupported = false;
    this.workers = {};
    this.resolveQueue = {};

    this.lastUsedWorkerIndex = -1;
  }

  init() {
    // If Workers not supported
    // TODO: Handle no workers support, do single threaded
    if (!window.Worker) return;

    this.workersSupported = true;

    // Create a Worker for each CPU vCore
    for (let i = 0; i < window.navigator.hardwareConcurrency; i++) {
      this.createWorker();
    }
  }

  createWorker() {
    let worker;
    if (process.env.NODE_ENV === "production") {
      // Load built production worker from static host. This is because its impossible to import Worker code directly in built NPM module
      const scriptURL =
        "https://cdn.jsdelivr.net/gh/ViperCharts/viper-charts-js@master/dist/viper.bundle.worker.js";
      const blob = new Blob([`importScripts("${scriptURL}")`], {
        type: "text/javascript",
      });
      const url = URL.createObjectURL(blob);
      worker = new Worker(url);
    } else {
      worker = new MyWorker({ type: "module" });
    }

    worker.onmessage = this.onWorkerMessage.bind(this);
    worker.onerror = this.onWorkerError.bind(this);

    const id = Utils.uniqueId();

    worker.postMessage({ type: "id", data: id });

    this.workers[id] = worker;
  }

  /**
   * Create a computed state for a newly created chart
   * @param {ChartState} chart The chart state
   * @returns {ComputedStateMessenger} API for messaging the computed state stored on a JS worker (separate CPU core)
   */
  createComputedState(chart) {
    const workerKeys = Object.keys(this.workers);

    this.lastUsedWorkerIndex++;

    // If index is larger than count of workers
    if (this.lastUsedWorkerIndex === workerKeys.length) {
      this.lastUsedWorkerIndex = 0;
    }

    // Get a worker
    const worker = this.workers[workerKeys[this.lastUsedWorkerIndex]];

    worker.postMessage({
      type: "addComputedState",
      data: { chartId: chart.id },
    });

    const computedStateMessenger = new ComputedStateMessenger({
      $global: this.$global,
      chart,
      worker,
    });

    return computedStateMessenger;
  }

  /**
   * Add resolve function to queue for resolving result of worker
   * @param {function} resolve
   * @returns {string} Resolve id
   */
  addToResolveQueue(resolve) {
    const id = Utils.uniqueId();
    this.resolveQueue[id] = resolve;
    return id;
  }

  onWorkerMessage(e) {
    const { type, data, resolveId, res } = e.data;

    switch (type) {
      case "updateInstructions":
        this.$global.charts[data.chartId].instructions = data.instructions;
        break;
      case "resolve":
        this.resolveQueue[resolveId](res);
        delete this.resolveQueue[resolveId];
        break;
    }
  }

  onWorkerError(e) {
    console.error(e);
  }
}
