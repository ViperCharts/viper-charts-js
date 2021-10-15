import EventEmitter from "../../events/event_emitter.ts";

class Dataset extends EventEmitter {
  constructor(id, name, data, timeframe) {
    super();
    this.id = id;
    this.name = name;
    this.data = data;
    this.timeframe = timeframe;
  }

  /**
   * Update the data and call all subscribers that updates were applied
   * @param {array} updates
   */
  updateData(updates) {
    // Check if new data item
    // TODO update all listeners to re-render this particular element
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

  async requestHistoricalData({ datasetId, start, end, timeframe }) {
    let [sourceId, id] = datasetId.split(":");

    const data = await this.$global.api.onRequestHistoricalData({
      sourceId,
      datasetId: id,
      start,
      end,
      timeframe,
    });

    // TODO timeout or error or whatever...

    const dataset = new Dataset(
      datasetId,
      // TODO CHANGE THIS THIS IS NOT SMART
      id,
      data,
      timeframe
    );
    this.datasets[datasetId] = dataset;

    return dataset;
  }

  addDataset(id, name, data) {
    const dataset = new Dataset(id, name, data);
    this.datasets[dataset.id] = dataset;
    this.fireEvent("add-dataset", dataset);
  }
}
