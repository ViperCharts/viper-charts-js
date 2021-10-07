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

    this.canvas = null;

    this.scrollListener = null;
    this.mousemoveListener = null;
    this.mouseleaveListener = null;
  }

  init() {
    const { subcharts } = this.$state.global.ui.charts[this.$state.chart.id];
    this.setCanvasElement(subcharts.main.current);

    // Add indicators to it
    new Background({ $state: this.$state, canvas: this.canvas });
    new Grid({ $state: this.$state, canvas: this.canvas });
    new LastPriceLine({ $state: this.$state, canvas: this.canvas });
    new Crosshair({ $state: this.$state, canvas: this.canvas });

    this.$state.global.layout.addEventListener(
      `resize-${this.$state.chart.id}`,
      ({ main }) => {
        this.canvas.setWidth(main.width);
      }
    );

    // Load initial indicators TEMP REMOVED
    // const settings = StorageManager.getChartSettings();
    const settings = {};
    if (settings.indicators) {
      for (const indicator of settings.indicators) {
        this.$state.chart.addIndicator(Indicators.map.get(indicator.id));
      }
    } else {
      this.$state.chart.addIndicator(Indicators.map.get("candlestick"));
      this.$state.chart.addIndicator(Indicators.map.get("volume-by-side"));
    }
  }

  setCanvasElement(canvas) {
    if (!this.canvas) {
      this.canvas = new Canvas({
        $state: this.$state,
        id: `canvas-${this.$state.chart.id}-main`,
        canvas,
        height: this.$state.dimensions.height - 20,
        width: this.$state.dimensions.width - 50,
        cursor: "crosshair",
      });
    }

    this.scrollListener = canvas.addEventListener(
      "wheel",
      this.onScroll.bind(this)
    );
    this.mousemoveListener = canvas.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this)
    );
    this.mouseleaveListener = canvas.addEventListener(
      "mouseleave",
      () => (this.$state.global.crosshair.visible = false)
    );
    canvas.addEventListener(
      "mouseenter",
      () => (this.$state.global.crosshair.visible = true)
    );
    this.$state.global.events.addEventListener(
      "mousemove",
      this.onWindowMouseMove.bind(this)
    );

    this.canvas.setCanvasElement(canvas);
  }

  onScroll(e) {
    if (e.deltaY < 0) this.$state.chart.resizeXRange(10, this.canvas.width);
    else if (e.deltaY > 0)
      this.$state.chart.resizeXRange(-10, this.canvas.width);
  }

  onMouseMove(e) {
    this.$state.global.crosshair.updateCrosshair(
      this.$state.chart,
      e.offsetX,
      e.offsetY
    );
  }

  onWindowMouseMove(e) {
    // If mouse down on child canvas
    if (!this.canvas.isMouseDown) return;

    console.log(e);
    this.$state.chart.handleMouseRangeChange(e.movementX, e.movementY);
  }
}
