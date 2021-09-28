import GlobalState from "../state/global.js";

export default class Chart {
  constructor({ data }) {
    this.$global = new GlobalState();
    const chart = this.$global.createChart();

    chart.data = data;
    chart.init();
  }
}
