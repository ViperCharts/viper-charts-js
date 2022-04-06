import _ from "lodash";

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

    this.layerToMove = -1;
    this.change = { x: 0, y: 0 };

    this.debounceSetVisibleRange = _.throttle(
      this.calculateNewVisibleRange.bind(this),
      16
    );
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
    let { deltaX, deltaY, offsetX, offsetY } = e;

    const { id: chartId } = this.$state.chart;
    const { main } = this.$state.global.layout.chartDimensions[chartId];
    const { width } = main;

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
      const layerId = this.$state.chart.getLayerByYCoord(offsetY);
      const layer = this.$state.chart.ranges.y[layerId];
      let { start, end } = this.$state.chart.ranges.x;
      let { min, max } = layer.range;

      // If zoom on Y axis
      if (
        this.$state.global.events.keys.Control ||
        this.$state.global.events.keys.Shift
      ) {
        layer.lockedYScale = false;
        const { top, height } = main.layers[layerId];

        const topP = (offsetY - top) / height;
        const bottomP = 1 - topP;
        const range = max - min;

        if (this.$state.global.events.keys.Shift) {
          deltaY = -deltaY;
        }

        if (deltaY < 0) {
          max -= (range * topP) / 10;
          min += (range * bottomP) / 10;
        } else {
          max += (range * topP) / 10;
          min -= (range * bottomP) / 10;
        }
      }

      if (!this.$state.global.events.keys.Shift) {
        const leftP = offsetX / width;
        const rightP = 1 - leftP;

        const range = end - start;

        if (deltaY > 0) {
          start -= (range * leftP) / 10;
          end += (range * rightP) / 10;
        } else {
          start += (range * leftP) / 10;
          end -= (range * rightP) / 10;
        }
      }

      this.$state.chart.setVisibleRange({ start, end, min, max }, layerId);
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

    if (this.layerToMove === -1) {
      const layerId = this.$state.chart.getLayerByYCoord(layerY);
      this.layerToMove = layerId;
    }

    this.change.x += movementX;
    this.change.y += movementY;

    this.debounceSetVisibleRange();
  }

  calculateNewVisibleRange() {
    const { x, y } = this.change;
    this.change = { x: 0, y: 0 };

    const { id } = this.$state.chart;
    const { layers } = this.$state.global.layout.chartDimensions[id].main;

    let { start, end } = this.$state.chart.ranges.x;
    let { min, max } = this.$state.chart.ranges.y[this.layerToMove].range;

    // Get how many candles moved
    const candlesMoved = x / this.$state.chart.pixelsPerElement;
    const timeMoved = this.$state.chart.timeframe * candlesMoved;

    start -= timeMoved;
    end -= timeMoved;

    if (!this.$state.chart.ranges.y[this.layerToMove].lockedYScale) {
      const pixelsPerTick = layers[this.layerToMove].height / (max - min);
      const priceMoved = y / pixelsPerTick;
      min += priceMoved;
      max += priceMoved;
    }

    this.$state.chart.setVisibleRange(
      { start, end, min, max },
      this.layerToMove
    );
  }
}
