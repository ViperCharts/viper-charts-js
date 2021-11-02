import Indicator from "../indicator.js";

export default class Candlestick extends Indicator {
  constructor({ $state, datasetId }) {
    super({
      $state,
      datasetId,
      consumers: ["open", "high", "low", "close"],
    });

    this.upColor = "#C4FF49";
    this.downColor = "#FE3A64";

    this.init(this.draw.bind(this));
  }

  draw({ open, high, low, close, plot, plotCandle }) {
    const color = close >= open ? this.upColor : this.downColor;
    plotCandle(open, high, low, close, "Candlestick", color, color);
  }
}
