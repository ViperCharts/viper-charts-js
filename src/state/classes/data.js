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

  fireRequest() {
    const { source, name, timeframe, data } = this.dataset;

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

    // Tell client to fire request
    this.$global.api.onRequestHistoricalData({
      source,
      name,
      timeframe,
      start: this.start,
      end: this.end,
      callback: ((updates) => {
        this.dataset.updateDataset(this.start, this.end, updates);
      }).bind(this.dataset),
    });

    // TODO create timeout for requests never returned
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

    this.datasets = {};
    this.sources = {};
    this.requests = {
      queue: {},
      order: [],
      count: 0,
    };
    this.isAttemptingToLoadRequests = false;
  }

  init() {}

  setAllDataSources(sources) {
    this.sources = sources;
    this.fireEvent("set-all-data-sources", this.sources);
  }

  // TODO dispatch this to an event queue on seperate thread
  requestHistoricalData({ dataset, start, end }) {
    const { source, name, timeframe } = dataset;
    const id = `${source}:${name}:${timeframe}`;

    // If dataset does not exist, fetch and create
    if (!this.datasets[id]) {
      dataset = new Dataset(this.$global, source, name, timeframe, {});
      this.datasets[dataset.getId()] = dataset;
    } else {
      dataset = this.datasets[id];
    }

    this.onNewRequest(dataset, start, end);

    return dataset;
  }

  addDataset(id, name, data) {
    const dataset = new Dataset(id, name, data);
    this.datasets[dataset.getId()] = dataset;
    this.fireEvent("add-dataset", dataset);
  }

  onNewRequest(dataset, start, end) {
    const id = dataset.getId();
    let request = this.requests.queue[id];

    // Check if a request for this dataset is already queued. If so, update start and end
    if (request) {
      request.updateTimes(start, end);
    }

    // If no request, create one for this dataset
    else {
      request = new Request(this.$global, dataset, start, end);
      this.requests.queue[id] = request;
      this.requests.order.push(id);
    }

    // Call load next request
    this.attemptToLoadNextRequest();
  }

  attemptToLoadNextRequest() {
    if (this.isAttemptingToLoadRequests) return;

    // If max requests for web browser in progress, return
    if (this.requests.count === 6) return;

    // If no queued requests, dont load
    if (!this.requests.order.length) return;

    this.isAttemptingToLoadRequests = true;

    // Loop through next n count of requests at a max of
    for (let i = this.requests.count; i < 6; i++) {
      this.requests.count++;
      const id = this.requests.order[0];
      this.requests.order.splice(0, 1);
      this.requests.queue[id].fireRequest();
      delete this.requests.queue[id];

      // If no next item, queue is empty
      if (!this.requests.order[i]) break;
    }

    this.isAttemptingToLoadRequests = false;
  }
}
