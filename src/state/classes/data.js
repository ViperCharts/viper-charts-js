import EventEmitter from "../../events/event_emitter.ts";

import Utils from "../../utils";

class Dataset extends EventEmitter {
  constructor($global, source, name, timeframe, data) {
    super();
    this.$global = $global;
    this.source = source;
    this.name = name;
    this.timeframe = timeframe;
    this.data = data;
    this.subscribers = {};
  }

  getId() {
    return `${this.source}:${this.name}:${this.timeframe}`;
  }

  getTimeframeAgnosticId() {
    return `${this.source}:${this.name}`;
  }

  /**
   * Update the data and call all subscribers that updates were applied
   * @param {object} dataset
   * @param {array} updates
   */
  updateDataset(start, end, updates) {
    // Check if new data item
    const { timeframe } = this;
    for (const timestamp of Utils.getAllTimestampsIn(start, end, timeframe)) {
      const point = updates[timestamp];
      if (!point) updates[timestamp] = null;
    }

    // Apply updates
    Object.assign(this.data, updates);

    // Update all listeners to re-render this particular element
    for (const chartId in this.subscribers) {
      const chart = this.$global.charts[chartId];

      // Load the visible data for this chart range
      chart.setVisibleRange();

      // Calculate all indicator data for subscribers to dataset
      const indicatorIdArray = this.subscribers[chartId];
      for (const renderingQueueId of indicatorIdArray) {
        chart.computedData.calculateOneSet(renderingQueueId);
      }

      // Re-generate pixel instructions for canvas
      // This MUST be done once. Otherwise it will waste resources
      // and be very laggy
      chart.computedData.generateInstructions();
    }
  }

  addSubscriber(chartId, renderingQueueId) {
    let subscribers = this.subscribers[chartId];
    if (!subscribers) {
      subscribers = [renderingQueueId];
    } else {
      subscribers.push(renderingQueueId);
    }

    this.subscribers[chartId] = subscribers;
  }

  removeSubscriber(chartId, renderingQueueId) {
    const subscribers = this.subscribers[chartId];

    if (!subscribers || !subscribers.length) {
      console.error("No subscribers from chart or subscribers active.");
      return;
    }

    const i = subscribers.indexOf(renderingQueueId);
    subscribers.splice(i, 1);

    // If no more subscribers to this chart, remove this chart
    if (subscribers.length === 0) {
      delete this.subscribers[chartId];
    }

    // If no more subscribers at all, remove from dataset array
    if (!Object.keys(this.subscribers).length) {
      delete this.$global.data.datasets[this.getId()];
    }

    return this.subscribers[chartId] || [];
  }
}

export default class DataState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;
    this.datasets = {};
    this.sources = {};
    this.requests = {
      queue: {},
      count: 0,
    };
    this.isAttemptingToLoadRequests = false;
  }

  init() {}

  setAllDataSources(sources) {
    this.sources = sources;
    this.fireEvent("set-all-data-sources", this.sources);
  }

  addOrGetDataset({ source, name, timeframe, data = {} }) {
    let dataset;
    const datasetId = `${source}:${name}:${timeframe}`;

    // If dataset does not exist, fetch and create
    if (!this.datasets[datasetId]) {
      dataset = new Dataset(this.$global, source, name, timeframe, data);
      this.datasets[datasetId] = dataset;
    } else {
      dataset = this.datasets[datasetId];
    }

    this.fireEvent("add-dataset", dataset);
    return dataset;
  }

  // TODO dispatch this to an event queue on seperate thread
  requestHistoricalData({ dataset, start, end }) {
    const id = dataset.getId();

    if (!this.requests.queue[id]) {
      this.requests.queue[id] = {};
    }

    const now = Date.now();
    const { timeframe } = dataset;
    for (const timestamp of Utils.getAllTimestampsIn(start, end, timeframe)) {
      // If timestamp is in the future, all other timestamps are to be ignored
      if (timeframe > now) break;

      // If data at time is already fetched, ignore it
      if (dataset.data[timestamp] === undefined) {
        continue;
      }

      if (!this.requests.queue[id][timestamp]) {
        this.requests.queue[id][timestamp] = "Queued";
      }
    }

    this.attemptToLoadNextRequest();
  }

  attemptToLoadNextRequest() {
    // If max requests for web browser in progress, return
    if (this.requests.count === 6) return;

    const ids = Object.keys(this.requests.queue);

    // If no queued requests, dont load
    if (!ids.length) return;

    // Loop through next n count of requests at a max of
    for (let i = this.requests.count; i < 6; i++) {
      if (i === ids.length) break;

      this.requests.count++;
      const id = ids[i];
      const timestamps = Object.keys(this.requests.queue[id]).sort(
        (a, b) => +b - +a
      );

      let start = -1;
      let end = -1;
      let itemCount = 0;
      for (const timestamp of timestamps) {
        // If found timestamp that is not needed to be fetched
        if (this.requests.queue[id][timestamp] !== "Queued") {
          if (end > -1) {
            break;
          }
        }

        // Found item that is queued
        if (end === -1) end = +timestamp;
        itemCount++;
        start = +timestamp;
        this.requests.queue[id][timestamp] = "Loading";

        if (itemCount === 100) break;
      }

      this.fireRequest(this.datasets[id], start, end);
    }
  }

  fireRequest(dataset, start, end) {
    const id = dataset.getId();

    const callback = (updates) => {
      const dataset = this.datasets[id];

      if (!dataset) {
        delete this.requests.queue[id];
      } else {
        for (const timestamp in Utils.getAllTimestampsIn(
          start,
          end,
          dataset.timeframe
        )) {
          delete this.requests.queue[id][timestamp];
        }

        // If no more requests for dataset, delete dataset object
        if (!Object.keys(this.requests.queue[id]).length) {
          delete this.requests.queue[id];
        }

        dataset.updateDataset.bind(dataset)(start, end, updates);
      }

      this.requests.count = Math.max(this.requests.count - 1, 0);
      this.attemptToLoadNextRequest();
    };

    this.$global.api.onRequestHistoricalData({
      source: dataset.source,
      name: dataset.name,
      timeframe: dataset.timeframe,
      start,
      end,
      callback,
    });
  }
}
