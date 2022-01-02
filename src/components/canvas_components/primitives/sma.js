import Indicator from "../indicator.js";

import Utils from "../../../utils";

export default class SMA extends Indicator {
  constructor({ $state, datasetId, color }) {
    super({ $state, datasetId, consumers: ["close"] });

    this.$state = $state;
    this.color = color;

    this.init(this.draw.bind(this));
  }

  draw({ plot, sma }) {
    const ma20 = sma({ source: "close", length: 20 });

    plot({
      value: ma20,
      title: "MA20",
      color: this.color,
      linewidth: 2,
      ylabel: true,
    });
  }
}
