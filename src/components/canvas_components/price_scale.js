import Canvas from "../canvas.js";
import Background from "./background.js";
import PriceSelected from "./price_selected.js";

// TODO rename to PriceScale
export default class TimeScale {
  constructor({ $state }) {
    this.$state = $state;

    this.canvas = null;
  }

  init() {
    this.canvas = new Canvas({
      $state: this.$state,
      id: `canvas-pricescale`,
      canvas:
        this.$state.global.ui.charts[this.$state.chart.id].subcharts.yScale
          .current,
      type: "yScale",
      height: this.$state.dimensions.height - 20,
      width: 50,
      cursor: "n-resize",
      position: "right",
    });

    new Background({
      $state: this.$state,
      canvas: this.canvas,
      color: "#080019",
    });
    new PriceSelected({ $state: this.$state, canvas: this.canvas });

    this.resizeChartLayoutListener = (({ yScale }) => {
      this.canvas.setHeight(yScale.height);
      this.canvas.setWidth(yScale.width);
    }).bind(this);
    this.$state.global.layout.addEventListener(
      `resize-${this.$state.chart.id}`,
      this.resizeChartLayoutListener
    );

    this.onResizeYScale = (({ yScale }) => {
      this.canvas.setHeight(yScale.height);
      this.canvas.setWidth(yScale.width);
    }).bind(this);
    this.$state.global.layout.addEventListener(
      `resize-y-scale-${this.$state.chart.id}`,
      this.onResizeYScale
    );

    this.mouseMoveListener = this.onWindowMouseMove.bind(this);
    this.$state.global.events.addEventListener(
      "mousemove",
      this.mouseMoveListener
    );
  }

  destroy() {
    this.$state.global.events.removeEventListener(
      "mousemove",
      this.mouseMoveListener
    );
    this.$state.global.layout.removeEventListener(
      `resize-${this.$state.chart.id}`,
      this.resizeChartLayoutListener
    );
    this.$state.global.layout.removeEventListener(
      `resize-y-scale-${this.$state.chart.id}`,
      this.onResizeYScale
    );
  }

  onWindowMouseMove({ movementY }) {
    if (!this.canvas.isMouseDown) return;
    if (movementY === 0) return;
    this.$state.chart.updateSettings({ lockedYScale: false });
    const { range } = this.$state.chart;
    const delta = range.max - range.min;
    const delta10P = delta * 0.01;
    const change = -movementY * delta10P;
    range.min += change;
    range.max -= change;
    this.$state.chart.setVisibleRange(range);
  }
}
