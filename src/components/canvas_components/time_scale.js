import chartState from "../../state/chart.js";
import Canvas from "../canvas.js";
import Background from "./background.js";
import Layer from "./layer.js";

export default class TimeScale {
  constructor() {
    this.canvas = new Canvas({
      id: `canvas-timescale`,
      height: 60,
      width: window.innerWidth,
      cursor: "e-resize",
    });
    this.background = new Background({
      canvas: this.canvas,
      color: "#080019",
    });
    this.timeScaleLayer = new TimeScaleLayer(this.canvas);

    this.init();
  }

  init() {}
}

class TimeScaleLayer extends Layer {
  constructor(canvas) {
    super(canvas);
    this.canvas = canvas;

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
        [time, 30],
        "" + `${d.getHours()}:${`0${d.getMinutes()}`.slice(-2)}`
      );
    }
  }
}
