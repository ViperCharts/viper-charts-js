import Layer from "../layer.js";

export default class PriceLine extends Layer {
  constructor({ $state, canvas, datasetId }) {
    super({ $state, canvas, type: "multi" });

    this.$state = $state;
    this.color = "#fff";

    this.datasetId = datasetId;
    this.consumers = ["time", "close"];
    this.init(this.draw.bind(this));
  }

  draw({ close, plot }) {
    plot(close);
  }
}
