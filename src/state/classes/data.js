import EventEmitter from "../../events/event_emitter.ts";

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
   * @param {array} updates
   */
  updateData(updates) {
    // Check if new data item
    // TODO update all listeners to re-render this particular element
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

  /**
   * Request historical data from master
   * @param {object { start: integer, end: integer }} timeRange Start and end time for data request
   */
  requestHistoricalData({ start, end }) {
    const params = { id: this.id, start, end };
    this.$global.api.fireEvent("request-historical-data", params);
  }
}

export default class LayoutState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.datasets = {};
    this.sources = {};
  }

  init() {}

  setAllDataSources(sources) {
    this.sources = sources;
    this.fireEvent("set-all-data-sources", this.sources);
  }

  // TODO dispatch this to an event queue on seperate thread
  async requestHistoricalData({ dataset, start, end }) {
    const { source, name, timeframe } = dataset;
    const id = `${source}:${name}:${timeframe}`;

    // If dataset does not exist, fetch and create
    if (!this.datasets[id]) {
      const data = await this.$global.api.onRequestHistoricalData({
        source,
        name,
        timeframe,
        start,
        end,
      });

      // TODO timeout or error or whatever...

      dataset = new Dataset(this.$global, source, name, timeframe, data);
      this.datasets[dataset.getId()] = dataset;
    } else {
      dataset = this.datasets[id];

      // TODO call requestHistoricalData if not all data between start and end is loaded
    }

    return dataset;
  }

  addDataset(id, name, data) {
    const dataset = new Dataset(id, name, data);
    this.datasets[dataset.getId()] = dataset;
    this.fireEvent("add-dataset", dataset);
  }
}
