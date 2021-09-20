import chartState from "../state/chart.js";
import layoutState from "../state/layout.js";

import Main from "./main.js";
import TimeScale from "../components/canvas_components/time_scale.js";
import PriceScale from "../components/canvas_components/price_scale.js";

import Vue from "vue";
import View from "../vue_components/View.vue";

const app = new Vue({
  el: "#app",
  render: (h) => h(View),
});

app.$on("increment", console.log);
const ChartView = app.$children[0];

export default class Chart {
  constructor({ data, element, height, width }) {
    layoutState.height.setHeight(height);
    layoutState.width.setWidth(width);

    chartState.data = data;
    chartState.chart = this;
    this.createLayout(element);

    this.chartState = chartState;

    this.subcharts = {
      main: new Main(),
      xScale: new TimeScale(),
      yScale: new PriceScale(),
    };

    chartState.setInitialVisibleRange(height - 20, width - 50);
  }

  createLayout(parent) {
    console.log(app);
    chartState.chartParentElement = ChartView.$refs.charts;
  }

  setWidth(width) {
    layoutState.width.setWidth(width);
  }

  setHeight(height) {
    layoutState.height.setHeight(height);
  }
}
