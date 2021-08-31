import Layer from "./layer.js";

import chartState from "../../state/chart.js";

export default class Grid extends Layer {
  constructor({ canvas, color }) {
    super(canvas);
    this.color = color;
  }

  draw() {
    // Loop through all visible candles
    for (const time of chartState.visibleScales.x) {
      const x = this.canvas.getXCoordByTimestamp(time);
      this.canvas.drawLine(this.color, [x, 0, x, this.canvas.height]);
    }
  }
}
