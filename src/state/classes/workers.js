import EventEmitter from "../../events/event_emitter";
import utils from "../../utils";

class ComputedStateMessenger {
  constructor({ chartId, worker }) {
    this.chartId = chartId;
    this.worker = worker;
  }

  addPixelInstructionsOffset(newRange, oldRange) {
    console.log(this.worker);
    this.worker.worker.postMessage({
      type: "runComputedStateMethod",
      data: {
        chartId: this.chartId,
        method: "addPixelInstructionsOffset",
        params: [newRange, oldRange],
      },
    });
  }

  generateInstructions() {}
}

export default class WorkerState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.workersSupported = false;
    this.workers = {};
    this.queue = {};
    this.inProgress = {};

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

    const id = utils.uniqueId();

    worker.postMessage({ type: "id", data: id });

    this.workers[id] = {
      worker,
      inUse: false,
    };
  }

  /**
   * Create a computed state for a newly created chart
   * @param {string} chartId The chart id
   * @returns {ComputedStateMessenger} API for messaging the computed state stored on a JS worker (separate CPU core)
   */
  createComputedState(chartId) {
    const workerKeys = Object.keys(this.workers);

    this.lastUsedWorkerIndex++;

    // If index is larger than count of workers
    if (this.lastUsedWorkerIndex === workerKeys.length) {
      this.lastUsedWorkerIndex = 0;
    }

    // Get a worker
    const worker = this.workers[workerKeys[this.lastUsedWorkerIndex]];

    worker.worker.postMessage({
      type: "addComputedState",
      data: { chartId },
    });

    const computedStateMessenger = new ComputedStateMessenger({
      chartId,
      worker,
    });

    return computedStateMessenger;
  }

  attemptToRunOnFreeWorker() {
    // Get an array of workers that are free
    const freeWorkerIds = Object.keys(this.workers).filter((id) => {
      if (!this.workers[id].inUse) return id;
    });

    const queueIds = Object.keys(this.queue);

    // Loop through each free worker id and apply queue item to it
    for (let i = 0; i < freeWorkerIds.length && i < queueIds.length; i++) {
      const queueId = queueIds[i];
      const queueItem = this.queue[queueId];
      const workerId = freeWorkerIds[i];
      const worker = this.workers[workerId];

      delete this.queue[queueId];
      worker.inUse = true;
      this.inProgress[queueId] = queueItem;

      const { method, params } = queueItem;
      worker.worker.postMessage({
        type: "method",
        data: { queueId, method, params },
      });
    }
  }

  dispatch({ id, method, params }) {
    return new Promise((resolve) => {
      if (!id) id = utils.uniqueId();

      this.queue[id] = {
        queueId: id,
        method,
        params,
        resolve,
      };

      this.attemptToRunOnFreeWorker();
    });
  }

  onWorkerMessage(e) {
    const { type, id, queueId, res } = e.data;

    switch (type) {
      case "finished":
        const queued = this.inProgress[queueId];
        if (!queued) return;
        queued.resolve(res);
        delete this.inProgress[queueId];
        this.workers[id].inUse = false;
        this.attemptToRunOnFreeWorker();
        break;
    }
  }

  onWorkerError(e) {
    console.error(e);
  }
}
