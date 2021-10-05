import GlobalState from "../state/global.js";

export default class Chart {
  constructor({ data, layout = {} }) {
    this.$global = GlobalState;
    this.$global.init();
    this.$global.data.addDataset("ftx:btc-perp", "BTC-PERP", data);
    this.$global.layout.setInitialLayout(layout);
  }
}
