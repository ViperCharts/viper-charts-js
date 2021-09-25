import Layer from "./layer.js";

export default class Background extends Layer {
  constructor({ canvas }) {
    super(canvas);
    this.color = "#080019";
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
