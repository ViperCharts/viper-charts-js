import Overlay from "./overlay.js";

export default class LastPriceLine extends Overlay {
  constructor({ $state, canvas }) {
    super({ $state, canvas });

    this.upColor = "#C4FF4966";
    this.downColor = "#FE3A6466";

    this.init(this.draw.bind(this));
  }

  draw() {
    // TODO fix this shitty fucking component
    return;
    // TODO dont hard code
    // const lastPoint = this.$state.visibleData[]
    if (!lastPoint) return;

    // Get last candle and draw price line
    const { close, open } = lastPoint;
    const isUp = close >= open;
    const color = isUp ? this.upColor : this.downColor;

    this.canvas.drawLineByPriceAndTime(color, [
      this.$state.chart.range.start,
      close,
      this.$state.chart.range.end,
      close,
    ]);
  }
}
