import Vue from "vue";
import View from "../../vue_components/View.vue";

export default class UIState {
  constructor({ $global }) {
    this.$global = $global;

    this.app = new Vue({
      el: "#app",
      render: (h) => h(View),
    });
    this.child = this.app.$children[0];
    this.chartsElements = this.child.$refs.charts;

    this.charts = {};
  }

  addChart(chartState) {
    this.child.$data.chartIds.push(chartState.id);

    setTimeout(() => {
      this.charts[chartState.id].timeframe = chartState.timeframe;
      Vue.set(this.charts[chartState.id], "indicators", chartState.indicators);
    });
  }

  addIndicator(chartId, indicator) {
    // Vue.set(this.charts[chartId].indicators, indicator.id, indicator);
  }
}
