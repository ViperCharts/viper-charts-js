import GlobalState from "../state/global.js";

export default class Chart {
  constructor({ data }) {
    this.$global = GlobalState;
    this.$global.layout.init;
    const chart = this.$global.createChart();

    chart.data = data;
    chart.init();
  }
}
