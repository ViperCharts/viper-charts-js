import Layer from "./layer.js";

export default class LastPriceLine extends Layer {
  constructor({ $state, canvas }) {
    super(canvas);

    this.$state = $state;

    this.upColor = "#C4FF4966";
    this.downColor = "#FE3A6466";
  }

  draw() {
    const newestCandle =
      this.$state.chart.data[this.$state.chart.data.length - 1];
    if (!newestCandle) return;

    // Get last candle and draw price line
    const { close, open } = newestCandle;
    const isUp = close >= open;
    const color = isUp ? this.upColor : this.downColor;

    this.canvas.drawLineByPriceAndTime(color, [
      this.$state.chart.range[0],
      close,
      this.$state.chart.range[1],
      close,
    ]);
  }
}
