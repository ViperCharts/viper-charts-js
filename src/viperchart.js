import GlobalState from "./state/global.js";

import EventEmitter from "./events/event_emitter";

import Constants from "./constants.js";

export default class Chart extends EventEmitter {
  constructor(params = {}) {
    super();

    const {
      layout = [],
      sources,
      onRequestHistoricalData = async () => {},
    } = params;

    this.$global = GlobalState;
    this.$global.api = this;
    this.onRequestHistoricalData = onRequestHistoricalData;

    this.$global.init();
    this.setAllDataSources(sources);
    this.$global.layout.setInitialLayout(layout);
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
