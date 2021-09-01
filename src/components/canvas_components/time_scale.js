import chartState from "../../state/chart.js";
import Canvas from "../canvas.js";
import Background from "./background.js";
import Layer from "./layer.js";
import TimeSelected from "./time_selected.js";

export default class TimeScale {
  constructor() {
    this.canvas = new Canvas({
      id: `canvas-timescale`,
      height: 20,
      width: window.innerWidth,
      cursor: "e-resize",
      position: "bottom",
    });
    this.background = new Background({
      canvas: this.canvas,
      color: "#080019",
    });
    this.timeScaleLayer = new TimeScaleLayer({ canvas: this.canvas });
    this.timeSelected = new TimeSelected({ canvas: this.canvas });

    this.init();
  }

  init() {}
}

class TimeScaleLayer extends Layer {
  constructor({ canvas }) {
    super(canvas);

    this.renderingQueueId = this.canvas.RE.addToQueue(this.draw.bind(this));
  }

  /**
   * Draw canvas function, this is a placeholder
   */
  draw() {
    for (const time of chartState.visibleScales.x) {
      const d = new Date(time);
      this.canvas.drawTextAtPriceAndTime(
        "#A7A8B3",
        [time, 15],
        "" + `${d.getHours()}:${`0${d.getMinutes()}`.slice(-2)}`
      );
    }
  }
}
