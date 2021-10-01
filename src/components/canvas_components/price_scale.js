import Canvas from "../canvas.js";
import Background from "./background.js";
import PriceSelected from "./price_selected.js";

export default class TimeScale {
  constructor({ $state }) {
    this.$state = $state;

    this.canvas = new Canvas({
      $state,
      id: `canvas-pricescale`,
      canvas:
        this.$state.global.ui.charts[this.$state.chart.id].subcharts.yScale
          .current,
      height: this.$state.global.layout.height - 20,
      width: 50,
      cursor: "n-resize",
      position: "right",
    });
    this.background = new Background({
      $state,
      canvas: this.canvas,
      color: "#080019",
    });
    this.priceSelected = new PriceSelected({ $state, canvas: this.canvas });

    this.init();
  }

  init() {
    this.$state.global.layout.addEventListener("resize", ({ height }) => {
      this.canvas.setHeight(height - 20);
    });
  }
}
