import Layer from "../layer.js";

export default class Candlestick extends Layer {
  constructor({ $state, canvas }) {
    super({ $state, canvas });

    this.$state = $state;

    this.upColor = "#C4FF49";
    this.downColor = "#FE3A64";

    this.consumers = ["time", "open", "high", "low", "close"];
    this.init(this.draw.bind(this));
  }

  draw() {
    for (const candle of this.$state.chart.visibleData) {
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
