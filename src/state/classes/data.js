import EventEmitter from "../../events/event_emitter.ts";

import Utils from "../../utils";

class Request {
  constructor($global, dataset, start, end) {
    this.$global = $global;
    this.dataset = dataset;
    this.start = start;
    this.end = end;
  }

  updateTimes(start, end) {
    if (start < this.start) this.start = start;
    if (end > this.end) this.end = end;
  }
}

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

    // Decrement requests in progress count and attempt to load another request if it exists'
    const { count } = this.$global.data.requests;
    this.$global.data.requests.count = Math.max(count - 1, 0);

    this.$global.data.attemptToLoadNextRequest();
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

    /**
     * queue: {
     *   "chartId": {
     *      1636425959598: "Queued",
     *      1636425959599: "Loading",
     *      1636425959598: "Errored-1636425959598"
     *      1636425959600: "Loaded"
     *    }
     * }
     */

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
  requestHistoricalData({ chartId, start, end }) {
    const { timeframe } = this.$global.charts[chartId];

    if (!this.requests.queue[chartId]) {
      this.requests.queue[chartId] = {};
    }

    const now = Date.now();
    for (const timestamp of Utils.getAllTimestampsIn(start, end, timeframe)) {
      // If timestamp is in the future, all other timestamps are to be ignored
      if (timeframe > now) break;

      if (!this.requests.queue[chartId][timestamp]) {
        this.requests.queue[chartId][timestamp] = "Queued";
      }
    }

    this.attemptToLoadNextRequest();

    return dataset;
  }

  attemptToLoadNextRequest() {
    // If max requests for web browser in progress, return
    if (this.requests.count === 6) return;

    const chartIds = Object.keys(this.requests.queue);

    // If no queued requests, dont load
    if (!chartIds.length) return;

    // Loop through next n count of requests at a max of
    for (let i = this.requests.count; i < 6; i++) {
      this.requests.count++;
      const chartId = chartIds[i];
      const timestamps = this.requests.queue[chartId];

      // Loop through all timestamps and verify

      // If no next item, queue is empty
      // if (!this.requests.order[i]) break;
    }
  }

  fireRequest(chartId) {
    // Get all

    // Make sure that some of the candles in this time spread from start to end
    // have not yet been loaded
    let isOkToFetch = false;
    const { start, end } = this;
    for (const timestamp of Utils.getAllTimestampsIn(start, end, timeframe)) {
      // Null means it was fetched already, so if not null, fetch
      if (data[timestamp] !== null) {
        isOkToFetch = true;
        break;
      }
    }

    if (!isOkToFetch) {
      return;
    }

    // Loop from end to start timeframe on timeframe * 100 interval to batch requests to max of 100 data points per
    let i = (end - start) / (timeframe * 100);
    const buildNextRequest = () => {
      if (i <= 0) return;

      let leftBound = i <= 1 ? start : end - timeframe * 100;

      // Tell client to fire request
      this.$global.api.onRequestHistoricalData({
        source,
        name,
        timeframe,
        start: leftBound,
        end,
        callback: ((updates) => {
          this.dataset.updateDataset(leftBound, end, updates);
          buildNextRequest();
        }).bind(this.dataset),
      });

      i = i - 1;
    };
    buildNextRequest();
  }
}
