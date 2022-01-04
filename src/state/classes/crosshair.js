import EventEmitter from "../../events/event_emitter";
import Utils from "../../utils";

export default class CrosshairState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.visible = false;
    this.timestamp = -1;
    this.price = -1;

    this.crosshairs = {};
  }

  init() {}

  /**
   * Add a crosshair to crosshair object
   * @param {string} chartId
   */
  addCrosshair(chartId) {
    this.crosshairs[chartId] = { x: -1, y: -1 };
  }

  /**
   *
   * @param {ChartState} chart
   * @param {int} x Canvas x position
   * @param {int} y Canvas y position
   */
  updateCrosshair(chart, x, y) {
    if (!this.visible) return;
    let timestamp = chart.getTimestampByXCoord(x);

    // Check if timestamp remainder is less than half a single timeframe unit
    // (that means left candle is closer than right candle)
    const remainder = timestamp % chart.timeframe;
    if (remainder < chart.timeframe / 2) {
      timestamp -= remainder;
    } else {
      timestamp += chart.timeframe - remainder;
    }

    const range = chart.range.max - chart.range.min;
    const screenPerc =
      y / this.$global.layout.chartDimensions[chart.id].main.height;
    const rangeOffset = (1 - screenPerc) * range;
    const price = chart.range.min + rangeOffset;

    this.timestamp = timestamp;
    this.price = Utils.toFixed(price, chart.computedState.maxDecimalPlaces);

    // Loop through all charts and get x and y pos using timestamp and price
    for (const chartId in this.$global.charts) {
      chart = this.$global.charts[chartId];
      if (!chart.isInitialized) continue;

      this.crosshairs[chart.id] = {
        x: chart.getXCoordByTimestamp(this.timestamp),
        y: chart.getYCoordByPrice(this.price),
      };
    }
  }
}
