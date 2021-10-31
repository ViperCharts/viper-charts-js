import Layer from "../layer.js";

export default class Candlestick extends Layer {
  constructor({ $state, canvas, datasetId }) {
    super({ $state, canvas, type: "multi" });

    this.$state = $state;

    this.upColor = "#C4FF49";
    this.downColor = "#FE3A64";

    this.datasetId = datasetId;
    this.consumers = ["time", "open", "high", "low", "close"];
    this.init(this.draw.bind(this));
  }

  draw({ time, open, high, low, close, plot, plotBox }) {
    const isUp = close >= open;
    const color = isUp ? this.upColor : this.downColor;

    // Draw wick from high to low as line
    this.canvas.drawLineByPriceAndTime(color, [time, high, time, low]);

    // Draw body from open to close
    this.canvas.drawBoxByPriceAndPercWidthOfTime(
      color,
      [time, open, close],
      0.9
    );
  }
}
