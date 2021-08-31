import Layer from "../layer.js";

import chartState from "../../../state/chart.js";

export default class Candlestick extends Layer {
  constructor({ canvas }) {
    super(canvas);
    this.upColor = "#C4FF49";
    this.downColor = "#FE3A64";
  }

  draw() {
    for (const candle of chartState.visibleData) {
      const isUp = candle.close >= candle.open;
      const color = isUp ? this.upColor : this.downColor;

      // Draw wick from high to low as line
      this.canvas.drawLineByPriceAndTime(color, [
        candle.time,
        candle.high,
        candle.time,
        candle.low,
      ]);

      // Draw body from open to close
      this.canvas.drawBoxByPriceAndPercWidthOfTime(
        color,
        [candle.time, candle.open, candle.close],
        0.9
      );
    }
  }
}
