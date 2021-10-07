import Constants from "../../constants.js";

import Utils from "../../utils.js";

import Main from "../../chart/main.js";
import TimeScale from "../../components/canvas_components/time_scale.js";
import PriceScale from "../../components/canvas_components/price_scale.js";

import StorageManager from "../../managers/storage.js";

import EventEmitter from "../../events/event_emitter.ts";

export default class ChartState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;
    this.isInitialized = false;

    this.id = Utils.uniqueId();
    this.timeframe = Constants.MINUTE;
    this.pixelsPerElement = 10;
    this.indicators = {};
    this.range = [];
    this.visibleData = [];
    this.visibleScales = { x: [], y: [] };
    this.subcharts = {
      main: undefined,
      xScale: undefined,
      yScale: undefined,
    };
  }

  init() {
    if (this.isInitialized) return;

    this.$global.layout.addEventListener(`resize-${this.id}`, ({ width }) => {
      this.resizeXRange(0, width);
    });

    const $state = {
      chart: this,
      global: this.$global,
      dimensions: this.$global.layout.chartDimensions[this.id],
    };

    // Add crosshair to crosshair state in prep for chart to be rendered
    this.$global.crosshair.addCrosshair(this.id);

    this.subcharts = {
      main: new Main({ $state }),
      xScale: new TimeScale({ $state }),
      yScale: new PriceScale({ $state }),
    };

    this.setInitialVisibleRange();

    this.subcharts.main.init();
    this.subcharts.xScale.init();
    this.subcharts.yScale.init();

    this.isInitialized = true;
  }

  addIndicator(indicator) {
    const { canvas } = this.subcharts.main;

    const $state = {
      chart: this,
      global: this.$global,
    };

    // Create an instance of the indicator class
    const instance = new indicator.class({
      $state,
      canvas,
    });

    const indi = {
      id: indicator.id,
      name: indicator.name,
      visible: true,
    };

    this.indicators[instance.renderingQueueId] = indi;

    this.$global.ui.charts[this.id].addIndicator(
      instance.renderingQueueId,
      indi
    );

    StorageManager.setChartSettings({
      indicators: Object.values(this.indicators).map((i) => ({ id: i.id })),
    });
  }

  toggleVisibility(id) {
    const { RE } = this.subcharts.main.canvas;

    RE.toggleVisibility(id);
    const visible = !this.indicators[id].visible;
    this.indicators[id].visible = visible;
    this.$global.ui.charts[this.id].updateIndicator(id, { visible });
  }

  removeIndicator(id) {
    const { RE } = this.subcharts.main.canvas;

    RE.removeFromQueue(id);
    delete this.indicators[id];

    this.$global.ui.charts[this.id].removeIndicator(id);
    StorageManager.setChartSettings({
      indicators: Object.values(this.indicators).map((i) => ({ id: i.id })),
    });
  }

  setVisibleRange({ start, end }) {
    const visibleData = [];

    const { data } = Array.from(this.$global.data.datasets.values())[0];

    // Start loop from right to find end candle
    for (let i = data.length - 1; i > -1; i--) {
      const candle = data[i];
      const timestamp = candle.time;

      // If right timestamp is not less than right view boundary
      // *We minus the timeframe to the timstamp so we can get data for candles that may be mostly
      // cut off screen
      if (timestamp > end + this.timeframe / 2) continue;

      visibleData.unshift(candle);

      // If last requried timestamp is reached
      if (timestamp < start + this.timeframe / 2) {
        break;
      }
    }

    this.visibleData = visibleData;

    // Calculate y axis by using candle low and highs
    let max = 0;
    let min = Infinity;
    for (const candle of this.visibleData) {
      if (candle.low < min) min = candle.low;
      if (candle.high > max) max = candle.high;
    }

    const ySpread5P = (max - min) * 0.05;
    this.range = [start, end, min - ySpread5P, max + ySpread5P];

    this.buildXAndYVisibleScales();
  }

  buildXAndYVisibleScales() {
    const visibleScales = { x: [], y: [] };
    let xTimeStep = 0;
    let yPriceStep = 0;

    const minPixels = 100;

    for (let i = Constants.TIMESCALES.indexOf(this.timeframe); i >= 0; i--) {
      // Check if this timeframe fits between max and min pixel boundaries
      const pixelsPerScale =
        this.pixelsPerElement * (Constants.TIMESCALES[i] / this.timeframe);

      if (pixelsPerScale >= minPixels) {
        xTimeStep = Constants.TIMESCALES[i];
        break;
      }
    }

    const yRange = this.range[3] - this.range[2];
    const exponent = yRange.toExponential().split("e")[1];
    yPriceStep = Math.pow(10, exponent);

    // Build timestamps that are on interval
    const start = this.range[0] - (this.range[0] % xTimeStep);
    for (let i = start; i < this.range[1]; i += xTimeStep) {
      visibleScales.x.push(i);
    }

    // TODO build y axis range
    const min = this.range[2] - (this.range[2] % yPriceStep);
    for (let i = min; i < this.range[3]; i += yPriceStep) {
      visibleScales.y.push(i);
    }

    this.visibleScales = visibleScales;
  }

  /**
   * Set the initial visible range of data
   */
  setInitialVisibleRange() {
    const { width } = this.$global.layout.chartDimensions[this.id].main;
    const { data } = Array.from(this.$global.data.datasets.values())[0];

    // End timestamp based on last element
    const end = data[data.length - 1].time + this.timeframe * 5;

    // Calculate start timestamp using width and pixelsPerElement
    const candlesInView = width / this.pixelsPerElement;
    // Set start to candlesInView lookback
    const start = end - candlesInView * this.timeframe;

    this.setVisibleRange({ start, end });
  }

  /**
   * Take x and y movements from canvas mouse listeners to update chart visible ranges
   * @param {number} movementX + or - mouse movement
   * @param {number} movementY + or - mouse movement
   */
  handleMouseRangeChange(movementX, movementY) {
    let [start, end, min, max] = this.range;

    const xDiff = end - start;
    const yDiff = max - min;

    const xChange = Math.floor(xDiff / 2000) * movementX;
    start -= xChange;
    end -= xChange;

    this.setVisibleRange({ start, end });
  }

  resizeXRange(delta, width) {
    const ppe = this.pixelsPerElement;

    if (delta < 0) {
      this.pixelsPerElement = Math.max(1, ppe - ppe / 5);
    } else if (delta > 0) {
      this.pixelsPerElement = Math.min(ppe + ppe / 5, 1000);
    }

    // End timestamp based on last element
    const end = this.range[1];

    // Calculate start timestamp using width and pixelsPerElement
    const candlesInView = width / this.pixelsPerElement;
    // Set start to candlesInView lookback
    const start = end - candlesInView * this.timeframe;

    this.setVisibleRange({ start, end });
  }

  getTimestampByXCoord(x) {
    const [start, end] = this.range;
    const msInView = end - start;
    const perc = x / this.$global.layout.chartDimensions[this.id].main.width;
    const time = perc * msInView;
    return start + time;
  }

  getXCoordByTimestamp(timestamp) {
    const [start, end] = this.range;
    const msInView = end - start;
    const msFromStart = timestamp - start;
    const perc = msFromStart / msInView;
    const w = this.$global.layout.chartDimensions[this.id].main.width;
    return Math.floor(perc * w);
  }

  getYCoordByPrice(price) {
    const [, , min, max] = this.range;
    const yInView = max - min;
    const yFromMin = price - min;
    const perc = yFromMin / yInView;
    const h = this.$global.layout.chartDimensions[this.id].main.height;
    return -Math.floor(perc * h - h);
  }

  /**
   * When React UI component re-mounts, update canvas element for children
   */
  onNewCanvas() {
    const { main, xScale, yScale } = this.$global.ui.charts[this.id].subcharts;

    this.$global.layout.resize();
    this.subcharts.main.setCanvasElement(main.current);
    this.subcharts.xScale.canvas.setCanvasElement(xScale.current);
    this.subcharts.yScale.canvas.setCanvasElement(yScale.current);
  }
}
