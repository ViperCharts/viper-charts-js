import GlobalState from "./state/global.js";

import EventEmitter from "./events/event_emitter.ts";

import Constants from "./constants";
import Indicators from "./components/indicators.js";

class Viper extends EventEmitter {
  constructor(params = {}) {
    super();

    const {
      sources,
      initialSettings = {},
      onRequestHistoricalData = () => {},
      onSaveViperSettings = () => {},
    } = params;

    this.$global = GlobalState;
    this.$global.api = this;
    this.onRequestHistoricalData = onRequestHistoricalData;
    this.onSaveViperSettings = onSaveViperSettings;

    this.$global.init();
    this.setAllDataSources(sources);
    this.$global.settings.parseInitialSettings(initialSettings);
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
    for (const chart of Object.values(this.$global.charts)) {
      if (chart.name === name) return chart;
    }
  }

  /**
   * Add a new dataset with an identifier, visible name, and the corresponding data
   * @param {string} id Data identifier, also used to identify requests for historical data in future requests
   * @param {string} title Visible title used in UI
   * @param {array[any]} data The data
   */
  addDataset(id, title, data) {
    if (!id || !id.length) {
      console.error("No dataset id provided");
      return;
    }
    if (!title || !title.length) {
      console.error("No dataset title provided");
      return;
    }
    if (!data || !data.length) {
      console.error("No dataset data provided");
      return;
    }
    this.$global.data.addDataset(id, title, data);
  }

  setAllDataSources(all) {
    this.$global.data.setAllDataSources(all);
  }

  /**
   * Update dataset
   */
  updateDataset(id, data) {
    this.global.data.datasets[id].updateData(data);
  }
}

export default {
  Viper,
  Constants,
  Indicators,
};
