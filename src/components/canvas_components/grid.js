import Layer from "./layer.js";

import chartState from "../../state/chart.js";

export default class Grid extends Layer {
  constructor({ canvas }) {
    super(canvas);
    this.color = "#434343";
  }

  draw() {
    // Loop through all visible candles
    for (const time of chartState.visibleScales.x) {
      const x = chartState.getXCoordByTimestamp(time);
      this.canvas.drawLine(this.color, [x, 0, x, this.canvas.height]);
    }
  }
}
