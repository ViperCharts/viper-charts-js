import Layer from "./layer";
import crosshairState from "../../state/crosshair.js";

export default class Crosshair extends Layer {
  constructor({ canvas }) {
    super(canvas);
  }

  draw() {
    // Draw horizontal line
    const { x, y } = crosshairState.crosshair;
    if (x < 0 || y < 0) return;
    this.canvas.drawLine("#ffffff88", [0, y, this.canvas.width, y]);
    this.canvas.drawLine("#ffffff88", [x, 0, x, this.canvas.height]);
  }
}
