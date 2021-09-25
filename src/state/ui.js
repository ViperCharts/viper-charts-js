import Vue from "vue";
import View from "../vue_components/View.vue";

class UIState {
  constructor() {
    this.app = new Vue({
      el: "#app",
      render: (h) => h(View),
    });
    this.child = this.app.$children[0];
    this.chartsElements = this.child.$refs.charts;
  }

  update(property, value) {
    this.child.setProperty(property, JSON.parse(JSON.stringify(value)));
  }
}

export default new UIState();
