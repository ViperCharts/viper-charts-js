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
    if (!this.$state) return;
    const id = this.$state.chart.computedData.addToQueue(this);
    this.renderingQueueId = id;
  }

  drawFunc(data) {
    this.drawImplentation(data);
  }
}
