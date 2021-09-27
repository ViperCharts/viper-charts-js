import Layer from "../layer.js";

import chartState from "../../../state/chart.js";

export default class PriceLine extends Layer {
  constructor({ $state, canvas, color }) {
    this.$state = $state;

    super(canvas);
    this.color = color;
  }

  draw() {
    // Loop through all visible candles
    for (let i = 0; i <= this.$state.chart.visibleData.length - 2; i++) {
      const thisCandle = this.$state.chart.visibleData[i];
      const nextCandle = this.$state.chart.visibleData[i + 1];
      const coords = [
        thisCandle.time,
        thisCandle.close,
        nextCandle.time,
        nextCandle.close,
      ];

      this.canvas.drawLineByPriceAndTime(this.color, coords);
    }
  }
}
