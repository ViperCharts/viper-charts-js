import Canvas from "../canvas.js";
import Background from "./background.js";
import PriceSelected from "./price_selected.js";
import PlottedLineValue from "./plotted_line_value";

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
    new PlottedLineValue({
      $state: this.$state,
      canvas: this.canvas,
    });
    new PriceSelected({ $state: this.$state, canvas: this.canvas });

    this.$state.global.layout.addEventListener(
      `resize-${this.$state.chart.id}`,
      ({ yScale }) => {
        this.canvas.setHeight(yScale.height);
      }
    );

    this.$state.global.events.addEventListener(
      "mousemove",
      this.onWindowMouseMove.bind(this)
    );
  }

  onWindowMouseMove({ movementY }) {
    if (!this.canvas.isMouseDown) return;
    if (movementY === 0) return;
    this.$state.chart.updateSettings({ lockedYScale: false });
    const { range } = this.$state.chart;
    const delta = range[3] - range[2];
    const delta10P = delta * 0.01;
    const change = -movementY * delta10P;
    range[2] += change;
    range[3] -= change;
    this.$state.chart.setRange(range);
  }
}
