import Layer from "./layer.js";

import chartState from "../../state/chart.js";
import crosshairState from "../../state/crosshair.js";

export default class TimeSelected extends Layer {
  constructor({ canvas }) {
    super(canvas);
  }

  draw() {
    const d = new Date(crosshairState.crosshair.timestamp);
    const dateText = `${
      d.getMonth() + 1
    }/${d.getDate()}/${d.getFullYear()} ${d.getHours()}:${`0${d.getMinutes()}`.slice(
      -2
    )}`;

    const x = crosshairState.crosshair.x;
    this.canvas.drawBox("#424242", [x - 45, 0, 90, 30]);
    this.canvas.drawText("#fff", [x, 15], dateText);
  }
}
