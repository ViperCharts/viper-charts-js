import Layer from "../layer.js";

import chartState from "../../../state/chart.js";

export default class PriceLine extends Layer {
  constructor({ canvas, color }) {
    super(canvas);
    this.color = color;
  }

  draw() {
    // Loop through all visible candles
    for (let i = 0; i <= chartState.visibleData.length - 2; i++) {
      const thisCandle = chartState.visibleData[i];
      const nextCandle = chartState.visibleData[i + 1];
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
