import EventEmitter from "../../events/event_emitter.ts";
import utils from "../../utils";

export default class WorkerState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.workersSupported = false;
    this.workers = {};
    this.queue = {};
  }

  init() {
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

  attemptToRunOnFreeWorker() {
    // Get an array of workers that are free
    const freeWorkerIds = Object.keys(this.workers).filter((id) => {
      if (!this.workers[id].inUse) return id;
    });

    const queueIds = Object.keys(this.queue).filter((id) => {
      if (!this.queue[id].running) return id;
    });

    // Loop through each free worker id and apply queue item to it
    for (let i = 0; i < freeWorkerIds.length && i < queueIds.length; i++) {
      const queueId = queueIds[i];
      const queueItem = this.queue[queueId];
      const workerId = freeWorkerIds[i];
      const worker = this.workers[workerId];

      worker.inUse = true;
      queueItem.running = true;

      const { method, params } = queueItem;
      console.log(params.sets);
      worker.worker.postMessage({
        type: "method",
        data: { queueId, method, params },
      });
    }
  }

  dispatch({ method, params, callback }) {
    const id = utils.uniqueId();

    Object.keys(params).forEach((p) => console.log(p, typeof params[p]));

    this.queue[id] = {
      queueId: id,
      method,
      params,
      callback,
      running: false,
    };
    this.attemptToRunOnFreeWorker();
  }

  onWorkerMessage(e) {
    const { type, id, queueId, res } = e.data;

    console.log(e.data);

    switch (type) {
      case "finished":
        const queued = this.queue[queueId];
        if (!queued) return;
        queued.callback(res);
        delete this.queue[queueId];
        this.workers[id].inUse = false;
        this.attemptToRunOnFreeWorker();
        break;
    }
  }

  onWorkerError(e) {
    console.error(e.data);
  }
}
