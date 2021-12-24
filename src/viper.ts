import GlobalState from "./state/global.js";

import EventEmitter from "./events/event_emitter";

import Constants from "./constants";
import Indicators from "./components/indicators.js";

type DatasetSource = {
  source: string; // Dataset source (ex: COINBASE, FTX)
  name: string; // Ticker (ex: BTC-USD, BTC-PERP)
  maxItemsPerRequest: number; // Max candles to fetch per request (rate limiting)
  timeframes: [number]; // Array of timeframes in milliseconds supported by dataset
};

type DatasetSourceMap = {
  [key: string]: DatasetSource;
};

type ViperParams = {
  element: HTMLElement; // The container element for Viper
  sources?: DatasetSourceMap; // Dataset sources map / object
  initialSettings?: { [key: string]: any }; // Initial settings, only send was recieved from onSaveViperSettings function
  onRequestHistoricalData?: ({ requests: [any], callback: Function }) => void; // Resolve requests for historical data
  onSaveViperSettings?: Function; //
};

export default class Viper extends EventEmitter {
  element: HTMLElement;
  $global: any;
  onRequestHistoricalData: Function;
  onSaveViperSettings: Function;
  Constants: object;
  Indicators: object;

  constructor(params: ViperParams) {
    super();

    const {
      element,
      sources,
      initialSettings = {},
      onRequestHistoricalData = async () => {},
      onSaveViperSettings = () => {},
    } = params;

    if (!element) {
      console.error("No 'element' provided in Viper constructor");
      return;
    }

    this.element = element;

    this.$global = GlobalState;
    this.$global.api = this;
    this.onRequestHistoricalData = onRequestHistoricalData;
    this.onSaveViperSettings = onSaveViperSettings;

    this.$global.init();
    this.setAllDataSources(sources);
    this.$global.settings.parseInitialSettings(initialSettings);

    this.Constants = Constants;
    this.Indicators = Indicators;
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
      if (chart["name"] === name) return chart;
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

  /**
   * Update dataset
   */
  updateDataset(id, data) {
    this.$global.data.datasets[id].updateData(data);
  }
}
