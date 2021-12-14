import Canvas from "../canvas.js";
import Background from "./background.js";
import Overlay from "./overlay.js";
import TimeSelected from "./time_selected.js";

export default class TimeScale {
  constructor({ $state }) {
    this.$state = $state;

    this.canvas = null;
  }

  init() {
    this.canvas = new Canvas({
      $state: this.$state,
      id: `canvas-timescale`,
      canvas:
        this.$state.global.ui.charts[this.$state.chart.id].subcharts.xScale
          .current,
      type: "xScale",
      height: 20,
      width: this.$state.dimensions.width - 50,
      cursor: "e-resize",
      position: "bottom",
    });

    this.background = new Background({
      canvas: this.canvas,
      color: "#080019",
    });
    this.timeScaleOverlay = new TimeScaleOverlay({
      $state: this.$state,
      canvas: this.canvas,
    });
    this.timeSelected = new TimeSelected({
      $state: this.$state,
      canvas: this.canvas,
    });

    this.onResizeChartListener = (({ xScale }) => {
      this.canvas.setWidth(xScale.width);
      this.canvas.setHeight(xScale.height);
    }).bind(this);
    this.$state.global.layout.addEventListener(
      `resize-${this.$state.chart.id}`,
      this.onResizeChartListener
    );
  }

  destroy() {
    this.$state.global.layout.removeEventListener(
      `resize-${this.$state.chart.id}`,
      this.onResizeChartListener
    );
  }
}

class TimeScaleOverlay extends Overlay {
  constructor({ $state, canvas }) {
    super({ canvas, type: "single" });

    this.$state = $state;

    this.init(this.draw.bind(this));
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
