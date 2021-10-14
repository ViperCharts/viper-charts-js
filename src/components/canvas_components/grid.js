import Layer from "./layer.js";

export default class Grid extends Layer {
  constructor({ $state, canvas }) {
    super({ canvas });

    this.$state = $state;
    this.color = "#434343";

    this.init(this.draw.bind(this));
  }

  draw() {
    // Loop through all visible candles
    for (const time of this.$state.chart.visibleScales.x) {
      const x = this.$state.chart.getXCoordByTimestamp(time);
      this.canvas.drawLine(this.color, [x, 0, x, this.canvas.height]);
    }
  }
}
