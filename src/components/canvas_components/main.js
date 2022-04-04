import Canvas from "../canvas.js";
import Crosshair from "./crosshair.js";
import LastPriceLine from "./last_price_line.js";

export default class Main {
  constructor({ $state }) {
    this.$state = $state;

    this.canvas = null;

    this.scrollListener = null;
    this.mousemoveListener = null;
    this.mouseleaveListener = null;

    // Layer being updated on visible range change
    this.layerToMove = -1;
  }

  init() {
    const { subcharts } = this.$state.global.ui.charts[this.$state.chart.id];
    this.setCanvasElement(subcharts.main.current);

    // Add indicators to it
    new LastPriceLine({ $state: this.$state, canvas: this.canvas });
    new Crosshair({ $state: this.$state, canvas: this.canvas });

    this.onResizeChart = (({ main }) => {
      this.canvas.setWidth(main.width);
      this.canvas.setHeight(main.height);
      this.$state.chart.setVisibleRange();
    }).bind(this);
    this.$state.global.layout.addEventListener(
      `resize-${this.$state.chart.id}`,
      this.onResizeChart
    );

    this.onResizeYScale = (({ main }) => {
      this.canvas.setWidth(main.width);
    }).bind(this);
    this.$state.global.layout.addEventListener(
      `resize-y-scale-${this.$state.chart.id}`,
      this.onResizeYScale
    );

    this.onWindowMouseMoveListener = this.onWindowMouseMove.bind(this);
    this.$state.global.events.addEventListener(
      "mousemove",
      this.onWindowMouseMoveListener
    );
  }

  destroy() {
    this.$state.global.layout.removeEventListener(
      `resize-${this.$state.chart.id}`,
      this.onResizeChart
    );
    this.$state.global.layout.removeEventListener(
      `resize-y-scale-${this.$state.chart.id}`,
      this.onResizeYScale
    );
    this.$state.global.events.removeEventListener(
      "mousemove",
      this.onWindowMouseMoveListener
    );
    this.removeCanvasListeners(this.canvas.canvas);
  }

  setCanvasElement(canvas) {
    if (this.canvas && this.canvas.canvas) {
      this.removeCanvasListeners(this.canvas.canvas);
    }

    if (!this.canvas) {
      this.canvas = new Canvas({
        $state: this.$state,
        id: `canvas-${this.$state.chart.id}-main`,
        canvas,
        type: "main",
        height: this.$state.dimensions.height - 20,
        width: this.$state.dimensions.width - 50,
        cursor: "crosshair",
      });
    }

    this.scrollListener = this.onScroll.bind(this);
    canvas.addEventListener("wheel", this.scrollListener);

    this.mousemoveListener = this.onMouseMove.bind(this);
    canvas.addEventListener("mousemove", this.mousemoveListener);

    this.mouseLeaveListener = this.onMouseLeave.bind(this);
    canvas.addEventListener("mouseleave", this.mouseLeaveListener);

    this.mouseEnterListener = this.onMouseEnter.bind(this);
    canvas.addEventListener("mouseenter", this.mouseEnterListener);

    this.canvas.setCanvasElement(canvas);
  }

  removeCanvasListeners(canvas) {
    if (!canvas);
    canvas.removeEventListener("wheel", this.scrollListener);
    canvas.removeEventListener("mousemove", this.mousemoveListener);
    canvas.removeEventListener("mouseleave", this.mouseLeaveListener);
    canvas.removeEventListener("mouseenter", this.mouseEnterListener);
  }

  /**
   *
   * @param {Scroll Event} e
   */
  onScroll(e) {
    e.preventDefault();
    const { deltaX, deltaY, offsetX } = e;

    const { width } =
      this.$state.global.layout.chartDimensions[this.$state.chart.id].main;

    // If horizontal scroll, move range
    if (deltaX !== 0) {
      const { pixelsPerElement: ppe, timeframe } = this.$state.chart;

      const d = deltaX;
      const change =
        (d > 0 ? d * 100 : -d * -100) * (width / ppe) * (timeframe / 60000);

      let { start, end } = this.$state.chart.ranges.x;
      start += change;
      end += change;

      this.$state.chart.setVisibleRange({ start, end });
    }

    // If vertical scroll
    else if (deltaY !== 0) {
      const leftP = offsetX / width;
      const rightP = 1 - leftP;
      const d = deltaY;
      const change = -(d > 0 ? -d * -50 : d * 50);
      this.$state.chart.resizeXRange(change, leftP, rightP);
    }
  }

  onMouseMove(e) {
    this.$state.global.crosshair.updateCrosshair(
      this.$state.chart,
      e.offsetX,
      e.offsetY
    );
  }

  onMouseLeave(e) {
    this.$state.global.crosshair.visible = false;
  }

  onMouseEnter() {
    this.$state.global.crosshair.visible = true;
  }

  onWindowMouseMove({ movementX, movementY, layerY }) {
    // If mouse down on child canvas
    if (!this.canvas.isMouseDown) {
      this.layerToMove = -1;
      return;
    }

    const { id } = this.$state.chart;
    const { layers } = this.$state.global.layout.chartDimensions[id].main;

    if (this.layerToMove === -1) {
      const layerId = this.$state.chart.getLayerByYCoord(layerY);
      this.layerToMove = layerId;
    }

    let { start, end } = this.$state.chart.ranges.x;
    let { min, max } = this.$state.chart.ranges.y[this.layerToMove].range;

    // Get how many candles moved
    const candlesMoved = movementX / this.$state.chart.pixelsPerElement;
    const timeMoved = this.$state.chart.timeframe * candlesMoved;

    start -= timeMoved;
    end -= timeMoved;

    if (!this.$state.chart.settings.lockedYScale && movementY !== 0) {
      const yInView = max - min;
      // Pixels per tick
      const ppt = yInView / layers[this.layerToMove].height;
      const y = movementY;
      const movement = y * ppt;
      min += movement;
      max += movement;
    }

    this.$state.chart.setVisibleRange(
      { start, end, min, max },
      this.layerToMove
    );
  }
}
