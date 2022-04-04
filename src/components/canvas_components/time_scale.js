import Canvas from "../canvas.js";

export default class TimeScale {
  constructor({ $state }) {
    this.$state = $state;

    this.canvas = null;
  }

  init() {
    this.canvas = new Canvas({
      $state: this.$state,
      id: `canvas-timescale`,
      canvas:
        this.$state.global.ui.charts[this.$state.chart.id].subcharts.xScale
          .current,
      type: "xScale",
      height: 20,
      width: this.$state.dimensions.width - 50,
      cursor: "e-resize",
      position: "bottom",
    });

    this.onResizeChartListener = (({ xScale }) => {
      this.canvas.setWidth(xScale.width);
      this.canvas.setHeight(xScale.height);
    }).bind(this);
    this.$state.global.layout.addEventListener(
      `resize-${this.$state.chart.id}`,
      this.onResizeChartListener
    );

    this.mouseMoveListener = this.onWindowMouseMove.bind(this);
    this.$state.global.events.addEventListener(
      "mousemove",
      this.mouseMoveListener
    );
  }

  onWindowMouseMove({ movementX }) {
    if (!this.canvas.isMouseDown) return;
    if (movementX === 0) return;

    const m = movementX;
    const change = -(m > 0 ? -m * -10 : m * 10);
    this.$state.chart.resizeXRange(change);
  }

  destroy() {
    this.$state.global.layout.removeEventListener(
      `resize-${this.$state.chart.id}`,
      this.onResizeChartListener
    );
    this.$state.global.events.removeEventListener(
      "mousemove",
      this.mouseMoveListener
    );
  }
}
