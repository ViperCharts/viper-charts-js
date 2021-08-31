/**
 * This class represents any individual peice of a canvas to be drawn
 */
export default class Layer {
  constructor(canvas) {
    this.canvas = canvas;

    this.renderingQueueId = this.canvas.RE.addToQueue(this.draw.bind(this));
  }

  /**
   * Draw canvas function, this is a placeholder
   */
  draw() {}
}
