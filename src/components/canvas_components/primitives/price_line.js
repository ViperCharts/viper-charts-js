import Layer from "../layer.js";

export default class PriceLine extends Layer {
  constructor({ $state, canvas }) {
    super({ $state, canvas });

    this.$state = $state;
    this.color = "#fff";

    this.consumers = ["time", "close"];
    this.init(this.draw.bind(this));
  }

  draw() {
    // Loop through all visible candles
    for (let i = 0; i <= this.$state.chart.visibleData.length - 2; i++) {
      const thisCandle = this.$state.chart.visibleData[i];
      const nextCandle = this.$state.chart.visibleData[i + 1];
      const coords = [
        thisCandle.time,
        Math.floor(thisCandle.close),
        nextCandle.time,
        Math.floor(nextCandle.close),
      ];

      this.canvas.drawLineByPriceAndTime(this.color, coords);
    }
  }
}
