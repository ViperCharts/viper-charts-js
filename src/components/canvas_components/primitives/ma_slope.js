import Indicator from "../indicator.js";

export default class MASlope extends Indicator {
  constructor({ $state, datasetId, color }) {
    super({ $state, datasetId, consumers: ["close"] });

    this.$state = $state;
    this.color = color;

    this.init(this.draw.bind(this));
  }

  draw({ plot, sma, setVar, getVar }) {
    const ma20 = sma({ source: "close", length: 20 });
    setVar({ name: "ma20", value: ma20 });

    const slope = ma20 - getVar({ name: "ma20", lookback: 1 });

    plot({
      value: slope,
      title: "MA20 Slope",
      color: this.color,
      linewidth: 2,
      ylabel: true,
    });
  }
}
