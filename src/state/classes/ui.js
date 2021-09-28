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
  }

  addChart(id, chartState) {}
}
