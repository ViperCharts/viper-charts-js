import EventEmitter from "../../events/event_emitter";
import Utils from "../../utils";

class ComputedStateMessenger {
  constructor({ $global, chart, worker }) {
    this.$global = $global;
    this.chart = chart;
    this.worker = worker;

    this.maxDecimalPlaces = 0;
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

  calculateOneSet({ key, timestamps, dataset }) {
    console.log(arguments);
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

  generateInstructions() {}
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
    const worker = new Worker("/src/workers/worker.js", { type: "module" });

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
    const { type, chartId, resolveId, res } = e.data;

    switch (type) {
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
