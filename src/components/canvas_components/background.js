import Overlay from "./overlay.js";

export default class Background extends Overlay {
  constructor({ canvas }) {
    super({ canvas });

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
