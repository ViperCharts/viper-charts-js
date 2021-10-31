import Layer from "./layer.js";

export default class Background extends Layer {
  constructor({ canvas }) {
    super({ canvas, type: "single" });

    this.color = "#080019";

    this.init(this.draw.bind(this));
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
