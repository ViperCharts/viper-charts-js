/**
 * This class represents any individual peice of a canvas to be drawn
 */
export default class Layer {
  constructor({ $state, canvas, type = "" }) {
    this.$state = $state;
    this.canvas = canvas;
    this.type = type;
    this.consumers = [];
  }

  init(drawImplentation) {
    this.drawImplentation = drawImplentation;
    this.renderingQueueId = this.canvas.RE.addToQueue(this);
  }

  drawFunc(data) {
    // If doesn't require state to be rendered
    if (!this.consumers.length) {
      this.drawImplentation();
      return;
    }

    // Is any data available?
    // if (!data) return;

    // Check if all required variables are present in each candle, then render
    // TODO cache this result and only rerun if visibleData changes
    // if (this..length) {
    //   for (const data of visibleData.data) {
    //     for (const consumer of this.consumers) {
    //       if (data[consumer] === undefined) {
    //         return;
    //       }
    //     }
    //   }
    // }

    this.drawImplentation(data);
  }
}
