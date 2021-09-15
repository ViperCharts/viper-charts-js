import Layer from "./layer.js";

import chartState from "../../state/chart.js";
import crosshairState from "../../state/crosshair.js";

export default class TimeSelected extends Layer {
  constructor({ canvas }) {
    super(canvas);
  }

  draw() {
    const p = crosshairState.crosshair.price;
    const y = crosshairState.crosshair.y;

    if (y < 0) return;

    this.canvas.drawBox("#424242", [0, y - 10, 50, 20]);
    this.canvas.drawText("#fff", [25, y + 3], p);
  }
}
