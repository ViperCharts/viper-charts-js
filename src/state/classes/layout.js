import EventEmitter from "../../events/event_emitter.ts";

import Utils from "../../utils";

export default class LayoutState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.height = 0;
    this.width = 0;
    this.layout = {};
    this.chartDimensions = {};
  }

  init() {
    window.addEventListener("resize", this.resize.bind(this));
    setTimeout(this.resize.bind(this));
  }

  setInitialLayout(layout) {
    const { id } = this.$global.createChart();
    layout[0].chartId = id;
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

    for (const chart of Object.values(this.chartDimensions)) {
      const { current } = this.$global.ui.charts[chart.id].chartContainer;
      if (current) {
        this.updateSize(chart.id, current.clientWidth, current.clientHeight);
      }
    }
  }

  updateSize(id, width, height) {
    this.chartDimensions[id] = { id, width, height };
    this.fireEvent(`resize-${id}`, { width, height });
  }

  addChart(id, width, height) {
    this.chartDimensions[id] = { isMounted: true, id, width, height };
  }
}
