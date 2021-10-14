import Canvas from "../canvas.js";
import Background from "./background.js";
import Grid from "./grid.js";
import Crosshair from "./crosshair.js";
import LastPriceLine from "./last_price_line.js";

import Indicators, { indicators } from "../indicators.js";

import StorageManager from "../../managers/storage.js";

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
        this.canvas.setHeight(main.height);
      }
    );

    // Load initial indicators TEMP REMOVED
    // const settings = StorageManager.getChartSettings();
    const settings = {};
    // if (settings.indicators) {
    //   for (const indicator of settings.indicators) {
    //     this.$state.chart.addIndicator(Indicators.map.get(indicator.id));
    //   }
    // } else {
    //   this.$state.chart.addIndicator(Indicators.map.get("candlestick"));
    //   this.$state.chart.addIndicator(Indicators.map.get("volume-by-side"));
    // }

    this.$state.global.events.addEventListener(
      "mousemove",
      this.onWindowMouseMove.bind(this)
    );
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

    this.canvas.setCanvasElement(canvas);
  }

  /**
   *
   * @param {Scroll Event} e
   */
  onScroll(e) {
    e.preventDefault();

    // If horizontal scroll, move range
    if (e.deltaX !== 0) {
      const ppe = this.$state.chart.pixelsPerElement;
      const { width } =
        this.$state.global.layout.chartDimensions[this.$state.chart.id].main;

      const d = e.deltaX;
      const change = (d > 0 ? d * 100 : -d * -100) * (width / ppe);

      let [start, end] = this.$state.chart.range;
      start += change;
      end += change;

      this.$state.chart.setVisibleRange({ start, end });
    }

    // If vertical scroll
    if (e.deltaY !== 0) {
      const d = e.deltaY;
      const change = -(d > 0 ? -d * -50 : d * 50);
      this.$state.chart.resizeXRange(change, this.canvas.width);
    }
  }

  onMouseMove(e) {
    this.$state.global.crosshair.updateCrosshair(
      this.$state.chart,
      e.offsetX,
      e.offsetY
    );
  }

  onWindowMouseMove({ movementX, movementY }) {
    // If mouse down on child canvas
    if (!this.canvas.isMouseDown) return;

    let [start, end, min, max] = this.$state.chart.range;

    // Get how many candles moved
    const candlesMoved = movementX / this.$state.chart.pixelsPerElement;
    const timeMoved = this.$state.chart.timeframe * candlesMoved;

    start -= timeMoved;
    end -= timeMoved;

    if (!this.$state.chart.settings.lockedYScale && movementY !== 0) {
      const yInView = max - min;
      // Pixels per tick
      const ppt = yInView / this.canvas.height;
      const y = movementY;
      const movement = y * ppt;
      this.$state.chart.range[2] += movement;
      this.$state.chart.range[3] += movement;
    }

    this.$state.chart.setVisibleRange({ start, end });
  }
}
