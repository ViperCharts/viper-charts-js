import Indicator from "../indicator.js";

export default class PriceLine extends Indicator {
  constructor({ $state, datasetId }) {
    super({ $state, datasetId, consumers: ["close"] });

    this.$state = $state;
    this.color = "#fff";

    this.init(this.draw.bind(this));
  }

  draw({ close, plot }) {
    plot(close);
  }
}
