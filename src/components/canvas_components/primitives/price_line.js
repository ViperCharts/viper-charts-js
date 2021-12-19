import Indicator from "../indicator.js";

export default class PriceLine extends Indicator {
  constructor({ $state, datasetId, color }) {
    super({ $state, datasetId, consumers: ["close"] });

    this.$state = $state;
    this.color = color;

    this.init(this.draw.bind(this));
  }

  draw({ close, plot }) {
    plot({
      value: close,
      title: "Price line",
      color: this.color,
      linewidth: 2,
      ylabel: true,
    });
  }
}
