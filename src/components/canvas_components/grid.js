import Overlay from "./overlay.js";

export default class Grid extends Overlay {
  constructor({ $state, canvas }) {
    super({ canvas, $state });

    this.color = "#434343";

    this.init(this.draw.bind(this));
  }

  draw() {
    // Loop through all visible candles
    for (const time of this.$state.chart.instructions.xScale.scales) {
      const x = this.$state.chart.getXCoordByTimestamp(time);
      this.canvas.drawLine(this.color, [x, 0, x, this.canvas.height]);
    }
  }
}
