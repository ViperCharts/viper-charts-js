/**
 * This class represents any individual peice of a canvas to be drawn
 */
export default class Layer {
  constructor({ $state, canvas }) {
    this.$state = $state;
    this.canvas = canvas;
    this.consumers = [];
  }

  init(drawImplentation) {
    this.drawImplentation = drawImplentation;
    this.renderingQueueId = this.canvas.RE.addToQueue(this.drawFunc.bind(this));
  }

  drawFunc() {
    // If doesn't require state to be rendered
    if (!this.$state) {
      this.drawImplentation();
      return;
    }

    // Is any data available?
    const { visibleData } = this.$state.chart;
    if (!visibleData.length) return;

    // Check if all required variables are present in each candle, then render
    // TODO cache this result and only rerun if visibleData changes
    if (this.consumers.length) {
      for (const data of visibleData) {
        for (const consumer of this.consumers) {
          if (data[consumer] === undefined) {
            return;
          }
        }
      }
    }

    this.drawImplentation(visibleData);
  }
}
