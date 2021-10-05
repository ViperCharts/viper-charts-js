import EventEmitter from "../../events/event_emitter.ts";

import Utils from "../../utils";

export default class LayoutState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.height = 0;
    this.width = 0;
    this.layout = {};
  }

  init() {
    window.addEventListener("resize", this.resize.bind(this));
    setTimeout(this.resize.bind(this));
  }

  setInitialLayout(layout) {
    const { id } = this.$global.createChart();
    layout[0].id = Utils.uniqueId();
    layout[0].chartId = id;
    layout[0].children = [];
    this.setLayout(layout);
  }

  setLayout(layout) {
    this.layout = layout;
    this.fireEvent("set-layout", this.layout);
  }

  resize() {
    const { current } = this.$global.ui.app.chartsElement;

    this.height = current.clientHeight;
    this.width = current.clientWidth;

    this.fireEvent("resize", {
      height: this.height,
      width: this.width,
    });
  }

  addChart(id) {
    // Create new chart
    this.chartDimensions.set(id, {
      id,
      height: 0,
      width: 0,
    });
  }
}
