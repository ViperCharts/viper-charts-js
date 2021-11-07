import Indicator from "../indicator.js";

import Utils from "../../../utils";

export default class PriceLine extends Indicator {
  constructor({ $state, datasetId }) {
    super({ $state, datasetId, consumers: ["close"] });

    this.$state = $state;
    this.color = Utils.randomHexColor();

    this.init(this.draw.bind(this));
  }

  draw({ close, plot }) {
    plot({
      value: close,
      title: "Price line",
      color: this.color,
      linewidth: 2,
    });
  }
}
