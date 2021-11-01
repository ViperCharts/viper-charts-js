import Indicator from "../indicator.js";

export default class Candlestick extends Indicator {
  constructor({ $state, datasetId }) {
    super({
      $state,
      datasetId,
      consumers: ["time", "open", "high", "low", "close"],
    });

    this.upColor = "#C4FF49";
    this.downColor = "#FE3A64";
  }

  draw({ time, open, high, low, close, plot, plotLine, plotBox }) {
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
