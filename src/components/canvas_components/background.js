import Layer from "./layer.js";

export default class Background extends Layer {
  constructor({ canvas, color }) {
    super(canvas);
    this.color = color;
  }

  draw() {
    this.canvas.drawBox(this.color, [
      0,
      0,
      this.canvas.width,
      this.canvas.height,
    ]);
  }
}
