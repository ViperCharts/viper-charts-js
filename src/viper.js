import GlobalState from "./state/global.js";
import packageJson from "../package.json";

import EventEmitter from "./events/event_emitter";

import Constants from "./constants";
import PlotTypes from "./components/plot_types.js";

export default class Viper extends EventEmitter {
  constructor(params) {
    super();

    this.init(params);
  }

  async init(params) {
    const {
      element,
      sources,
      settings = {},
      onRequestHistoricalData = async () => {},
      onRequestOrders = async () => {},
      onRemoveDatasetModel = () => {},
      onSaveViperSettings = () => {},
      onRequestTemplates = () => {},
      onSaveTemplate = () => {},
      onDeleteTemplate = () => {},

      workerScriptURL = `https://cdn.jsdelivr.net/gh/ViperCharts/viper-charts-js@master/.worker-releases/viper.bundle.${packageJson.version}.worker.js`,
    } = params;

    if (!element) {
      console.error("No 'element' provided in Viper constructor");
      return;
    }

    this.element = element;

    this.$global = new GlobalState();
    this.$global.api = this;
    this.onRequestHistoricalData = onRequestHistoricalData;
    this.onRequestOrders = onRequestOrders;
    this.onRemoveDatasetModel = onRemoveDatasetModel;
    this.onSaveViperSettings = onSaveViperSettings;
    this.onRequestTemplates = onRequestTemplates;
    this.onSaveTemplate = onSaveTemplate;
    this.onDeleteTemplate = onDeleteTemplate;
    this.workerScriptURL = workerScriptURL;

    await this.$global.init();
    this.setAllDataSources(sources);

    this.$global.settings.setSettings(settings);

    this.Constants = Constants;
    this.PlotTypes = PlotTypes;
  }

  /**
   * Get currently selected chart
   */
  getSelectedChart() {
    return this.$global.charts[this.$global.selectedChartId];
  }

  /**
   * Get a chart by name
   * @param {string} name Chart name
   */
  getChartByName(name = "") {
    for (const id in this.$global.charts) {
      const chart = this.$global.charts[id];
      if (chart.name === name) return chart;
    }
  }

  /**
   * Add a new dataset with an identifier, visible name, and the corresponding data
   * @param {string} id Data identifier, also used to identify requests for historical data in future requests
   * @param {string} title Visible title used in UI
   * @param {array[any]} data The data
   */
  addDataset({ source, name, timeframe, data }) {
    if (!source || !source.length) {
      console.error("No dataset source provided");
      return;
    }
    if (!name || !name.length) {
      console.error("No dataset name provided");
      return;
    }
    if (!timeframe || typeof timeframe !== "number") {
      console.error("No timeframe provided or not numeric value");
      return;
    }
    if (!data || typeof data !== "object") {
      console.error("No dataset data provided");
      return;
    }
    this.$global.data.addOrGetDataset({ source, name, timeframe, data });
  }

  setAllDataSources(all) {
    this.$global.data.setAllDataSources(all);
  }

  addData({ source, name, timeframe, dataModel }, updates = {}, options = {}) {
    const { noResolve = false, updateVisibleRange = false } = options;

    const id = `${source}:${name}:${timeframe}`;
    const dataset = this.$global.data.datasets[id];

    // If dataset was deleted since request was fired
    if (!dataset) return;

    // Update data
    dataset.updateDataset.bind(dataset)(updates, dataModel);

    if (!noResolve) {
      dataset.pendingRequests[dataModel]--;
      dataset.fireEvent("pending-requests", dataset.pendingRequests);
    }

    if (updateVisibleRange) {
      for (const chartId in dataset.subscribers) {
        // dataset.subscribers[chartId].setVisibleRange({})
      }
    }
  }

  /**
   * Add, update, or remove an Order for a Dataset (market)
   * @param {string} timeframeAgnosticDatasetId
   * @param {object} order
   * @param {string|number} order.orderId
   * @param {'buy'|'sell'} order.side
   * @param {number} order.price
   * @param {number} order.quantity
   */
  addOrUpdateOrder(timeframeAgnosticDatasetId, order) {
    this.$global.orders.addOrUpdateOrder(timeframeAgnosticDatasetId, order);
  }

  /**
   * Destroy Viper instance
   */
  destroy() {
    // Destroy all event listeners
    this.$global.events.destroy();
    this.$global.layout.destroy();
    this.$global.ui.destroy();
    this.$global.settings.destroy();

    // TODO Kill all workers
  }
}
