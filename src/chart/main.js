import Canvas from "../components/canvas.js";
import Background from "../components/canvas_components/background.js";
import Grid from "../components/canvas_components/grid.js";
import Crosshair from "../components/canvas_components/crosshair.js";
import LastPriceLine from "../components/canvas_components/last_price_line.js";

import Indicators, { indicators } from "../components/indicators.js";

import StorageManager from "../managers/storage.js";

export default class Main {
  constructor({ $state }) {
    this.$state = $state;

    this.canvas = new Canvas({
      $state,
      id: `canvas-${this.id}-main`,
      canvas:
        this.$state.global.ui.charts[this.$state.chart.id].subcharts.main
          .current,
      height: this.$state.global.layout.height.height - 20,
      width: this.$state.global.layout.width.width - 50,
      cursor: "crosshair",
    });

    this.scrollListener = null;
    this.mousemoveListener = null;
    this.mouseleaveListener = null;

    setTimeout(() => this.init());
  }

  init() {
    // Add indicators to it
    new Background({ $state: this.$state, canvas: this.canvas });
    new Grid({ $state: this.$state, canvas: this.canvas });
    new LastPriceLine({ $state: this.$state, canvas: this.canvas });
    new Crosshair({ $state: this.$state, canvas: this.canvas });

    this.scrollListener = this.canvas.canvas.addEventListener(
      "wheel",
      this.onScroll.bind(this)
    );
    this.mousemoveListener = this.canvas.canvas.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this)
    );
    this.mouseleaveListener = this.canvas.canvas.addEventListener(
      "mouseleave",
      () => this.$state.global.crosshair.crosshair.updateCrosshair(-1, -1)
    );
    this.$state.global.layout.height.addEventListener("setHeight", (height) =>
      this.canvas.setHeight(height - 20)
    );
    this.$state.global.layout.width.addEventListener("setWidth", (width) =>
      this.canvas.setWidth(width - 50)
    );

    // Load initial indicators
    const settings = StorageManager.getChartSettings();
    if (settings.indicators) {
      for (const indicator of settings.indicators) {
        this.$state.chart.addIndicator(Indicators.map.get(indicator.id));
      }
    } else {
      this.$state.chart.addIndicator(Indicators.map.get("candlestick"));
      this.$state.chart.addIndicator(Indicators.map.get("volume-by-side"));
    }
  }

  onScroll(e) {
    if (e.deltaY < 0) this.$state.chart.resizeXRange(10, this.canvas.width);
    else if (e.deltaY > 0)
      this.$state.chart.resizeXRange(-10, this.canvas.width);
  }

  onMouseMove(e) {
    this.$state.global.crosshair.crosshair.updateCrosshair(
      e.offsetX,
      e.offsetY
    );
  }
}
