import Canvas from "../canvas.js";
import Background from "./background.js";
import Layer from "./layer.js";
import TimeSelected from "./time_selected.js";

export default class TimeScale {
  constructor({ $state }) {
    this.$state = $state;

    this.canvas = new Canvas({
      $state,
      id: `canvas-timescale`,
      height: 20,
      width: this.$state.layout.width.width - 50,
      cursor: "e-resize",
      position: "bottom",
    });
    this.background = new Background({
      canvas: this.canvas,
      color: "#080019",
    });
    this.timeScaleLayer = new TimeScaleLayer({ $state, canvas: this.canvas });
    this.timeSelected = new TimeSelected({ $state, canvas: this.canvas });

    this.init();
  }

  init() {
    this.$state.layout.width.addEventListener("setWidth", (width) =>
      this.canvas.setWidth(width - 50)
    );
  }
}

class TimeScaleLayer extends Layer {
  constructor({ $state, canvas }) {
    super(canvas);

    this.$state = $state;

    this.renderingQueueId = this.canvas.RE.addToQueue(this.draw.bind(this));
  }

  /**
   * Draw canvas function, this is a placeholder
   */
  draw() {
    for (const time of this.$state.chart.visibleScales.x) {
      const d = new Date(time);
      this.canvas.drawTextAtPriceAndTime(
        "#A7A8B3",
        [time, 15],
        "" + `${d.getHours()}:${`0${d.getMinutes()}`.slice(-2)}`
      );
    }
  }
}
