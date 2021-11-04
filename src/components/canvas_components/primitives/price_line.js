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
    plot(close, "Price line", this.color, 2);
  }
}
