import Canvas from "../canvas.js";
import Background from "./background.js";

// TODO rename to PriceScale
export default class TimeScale {
  constructor({ $state }) {
    this.$state = $state;

    this.canvas = null;

    this.layerToMove = -1;
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

  onWindowMouseMove({ movementY, layerY }) {
    if (!this.canvas.isMouseDown) {
      this.layerToMove = -1;
      return;
    }
    if (movementY === 0) return;

    const { chart } = this.$state;

    if (this.layerToMove === -1) {
      const layerId = chart.getLayerByYCoord(layerY);
      this.layerToMove = layerId;
    }

    let { min, max } = chart.ranges.y[this.layerToMove].range;
    const delta = max - min;
    const delta10P = delta * 0.01;
    const change = -movementY * delta10P;
    min += change;
    max -= change;
    chart.ranges.y[this.layerToMove].lockedYScale = false;
    chart.setVisibleRange({ min, max }, this.layerToMove);
  }
}
