import Layer from "./layer.js";

import chartState from "../../state/chart.js";

export default class LastPriceLine extends Layer {
  constructor({ canvas }) {
    super(canvas);
    this.upColor = "#C4FF4966";
    this.downColor = "#FE3A6466";
  }

  draw() {
    // Get last candle and draw price line
    const { close, open } =
      chartState.visibleData[chartState.visibleData.length - 1];
    const isUp = close >= open;
    const color = isUp ? this.upColor : this.downColor;

    this.canvas.drawLineByPriceAndTime(color, [
      chartState.range[0],
      close,
      chartState.range[1],
      close,
    ]);
  }
}
