import Layer from "./layer.js";

export default class LastPriceLine extends Layer {
  constructor({ $state, canvas }) {
    super({ $state, canvas, type: "single" });

    this.$state = $state;

    this.upColor = "#C4FF4966";
    this.downColor = "#FE3A6466";

    this.consumers = ["close"];
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
      this.$state.chart.range[0],
      close,
      this.$state.chart.range[1],
      close,
    ]);
  }
}
