import chartState from "../state/chart.js";
import layoutState from "../state/layout.js";

import Vue from "vue";
import View from "../vue_components/View.vue";

const app = new Vue({
  el: "#app",
  render: (h) => h(View),
});

app.$on("increment", console.log);
const ChartView = app.$children[0];

export default class Chart {
  constructor({ data, element }) {
    chartState.data = data;
    chartState.chart = this;
    this.createLayout(element);

    this.chartState = chartState;
  }

  createLayout() {
    chartState.chartParentElement = ChartView.$refs.charts;
    layoutState.resize();
    chartState.setInitialVisibleRange(
      layoutState.height.height - 20,
      layoutState.width.width - 50
    );
  }
}
