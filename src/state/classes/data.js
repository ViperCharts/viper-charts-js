import EventEmitter from "../../events/event_emitter";

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
    this.dependencies = new Set();
  }

  getId() {
    return `${this.source}:${this.name}:${this.timeframe}`;
  }

  getTimeframeAgnosticId() {
    return `${this.source}:${this.name}`;
  }

  /**
   * Update the data and call all subscribers that updates were applied
   * @param {object} updates Object[time]{ ...values }
   * @param {string} model Model id (eg: price, volume, openInterest)
   */
  updateDataset(updates, model) {
    let timestamps = new Set();

    // Apply updates
    for (const key in updates) {
      let time = key;

      if (typeof time === "string") {
        time = new Date(time).getTime();
        timestamps.add(time);
      }

      if (!this.data[time]) {
        this.data[time] = {
          [model]: updates[key],
        };
        continue;
      }

      this.data[time][model] = updates[key];
    }

    timestamps = Array.from(timestamps.keys()).sort((a, b) => a - b);

    // Update all listeners to re-render this particular element
    for (const chartId in this.subscribers) {
      const chart = this.$global.charts[chartId];

      // Load the visible data for this chart range
      chart.setVisibleRange();

      // Calculate all indicator data for new time additions
      for (const renderingQueueId in this.subscribers[chartId]) {
        chart.computedState.calculateOneSet({
          renderingQueueId,
          timestamps,
          dataset: {
            source: this.source,
            name: this.name,
            timeframe: this.timeframe,
            data: this.data,
          },
        });
      }
    }
  }

  addSubscriber(chartId, renderingQueueId, dependencies) {
    let subscribers = this.subscribers[chartId];
    if (!subscribers) {
      subscribers = {};
    }
    subscribers[renderingQueueId] = dependencies;

    // Add to cached dependencies set
    dependencies.forEach((d) => this.dependencies.add(d));

    this.subscribers[chartId] = subscribers;
  }

  removeSubscriber(chartId, renderingQueueId) {
    const subscribers = this.subscribers[chartId];

    if (!subscribers) {
      console.error("No subscribers from chart or subscribers active.");
      return;
    }

    delete subscribers[renderingQueueId];

    // If no more subscribers to this chart, remove this chart
    if (Object.keys(subscribers).length === 0) {
      delete this.subscribers[chartId];
    }

    // If no more subscribers at all, remove from dataset array
    if (!Object.keys(this.subscribers).length) {
      delete this.$global.data.datasets[this.getId()];
    }

    // Rebuild dependency set
    this.dependencies.clear();
    for (const chartId in this.subscribers) {
      const subscriber = this.subscribers[chartId];
      for (const id in subscriber) {
        const dependencies = subscriber[id];
        for (const dependency of dependencies) {
          this.dependencies.add(dependency);
        }
      }
    }

    return this.subscribers[chartId] || {};
  }
}

export default class DataState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;
    this.datasets = {};
    this.sources = {};

    this.allRequestedPoints = {};
    this.requestInterval = setInterval(this.fireRequest.bind(this), 250);
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

  requestDataPoints({ dataset, start, end }) {
    const { timeframe } = dataset;
    const id = dataset.getId();
    const now = Date.now();

    const requestedPoint = [Infinity, -Infinity, new Set()];
    const dependencies = Array.from(dataset.dependencies.keys());

    // Loop through each requested timestamp and check if any are not found
    for (const timestamp of Utils.getAllTimestampsIn(start, end, timeframe)) {
      // Check if greater than now
      if (timestamp > now) break;

      const missingData = [];

      // Check if in data state
      if (dataset.data[timestamp] === undefined) {
        missingData = dependencies;
        dataset.data[timestamp] = {};
      } else {
        // Check all models for missing data
        for (const d of dependencies) {
          if (dataset.data[timestamp][d] === undefined) {
            missingData.push(d);
          }
        }
      }

      if (!missingData.length) continue;

      // Add to state
      missingData.forEach((m) => requestedPoint[2].add(m));
      if (timestamp < requestedPoint[0]) {
        requestedPoint[0] = timestamp;
      }
      if (timestamp > requestedPoint[1]) {
        requestedPoint[1] = timestamp;
      }
    }

    // If no unloaded data, or start and end time are not valid, don't add request
    if (requestedPoint[0] === Infinity || requestedPoint[1] === -Infinity) {
      return;
    }

    requestedPoint[2] = Array.from(requestedPoint[2].keys());
    this.allRequestedPoints[id] = requestedPoint;
  }

  fireRequest() {
    const allRequestedPoints = JSON.parse(
      JSON.stringify(this.allRequestedPoints)
    );
    this.allRequestedPoints = {};
    const datasetIds = Object.keys(allRequestedPoints);

    // Check if any requested times for any datasets
    if (!datasetIds.length) return;

    // Loop through all requested timestamps and mark their dataset data points as fetched
    for (const id of datasetIds) {
      const [start, end, dataModels] = allRequestedPoints[id];
      const dataset = this.datasets[id];
      const { timeframe } = dataset;

      // This is so data does not get requested again
      for (const timestamp of Utils.getAllTimestampsIn(start, end, timeframe)) {
        for (const dataModel of dataModels) {
          dataset.data[timestamp][dataModel] = null;
        }
      }
    }

    // Build array with requested sources, names, timeframes, and start & end times
    let requests = [];
    for (const id of datasetIds) {
      let [start, end, dataModels] = allRequestedPoints[id];
      const dataset = this.datasets[id];
      const { source, name, timeframe } = dataset;

      // Loop from end to start timeframe on timeframe * 300 interval to batch requests to max of 300 data points per
      for (let i = (end - start) / (timeframe * 300); i > 0; i--) {
        const leftBound = i <= 1 ? start : end - timeframe * 300;

        requests.push({
          id,
          source,
          name,
          dataModels,
          timeframe,
          start: leftBound,
          end,
        });

        end -= timeframe * 100;
      }
    }

    // Sort by latest timestamps
    requests = requests.sort((a, b) => b.end - a.end);

    const callback = (id, updates = {}, model) => {
      const dataset = this.datasets[id];

      // If dataset was deleted since request was fired
      if (!dataset) return;

      // Update data
      dataset.updateDataset.bind(dataset)(updates, model);
    };

    this.$global.api.onRequestHistoricalData({
      requests,
      callback: callback.bind(this),
    });
  }
}
