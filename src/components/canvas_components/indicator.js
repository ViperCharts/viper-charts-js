import Layer from "./layer.js";

export default class Indicator extends Layer {
  constructor({ $state, datasetId, consumers }) {
    super();

    this.$state = $state;
    this.datasetId = datasetId;
    this.consumers = consumers;
  }

  init(drawImplentation) {
    this.drawImplentation = drawImplentation;
    this.$state.chart.computedData.addToQueue(this);
  }

  drawFunc(data) {
    this.drawImplentation(data);
  }
}
