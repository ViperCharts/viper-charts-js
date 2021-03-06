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

    this.updateCrosshairTimeAndPrice(chart, x, y);

    // Loop through all charts and get x and y pos using timestamp and price
    for (const chartId in this.$global.charts) {
      chart = this.$global.charts[chartId];
      if (!chart.isInitialized) continue;

      this.crosshairs[chart.id] = {
        x: chart.getXCoordByTimestamp(this.timestamp),
        y: {},
      };

      // Loop through all layers on chart and draw crosshair config for each
      const { layers } = this.$global.layout.chartDimensions[chartId].main;
      for (const id in chart.ranges.y) {
        const { top, height } = layers[id];

        const yCoord = chart.getYCoordByPrice(this.price, id);
        if (yCoord < top || yCoord > top + height) {
          continue;
        }

        this.crosshairs[chart.id].y[id] = yCoord;
      }
    }
  }

  updateCrosshairTimeAndPrice(chart, x, y) {
    if (!x || !y) {
      x = this.crosshairs[chart.id].x;
      y = this.crosshairs[chart.id].y;
    }

    let timestamp = chart.getTimestampByXCoord(x);

    // Check if timestamp remainder is less than half a single timeframe unit
    // (that means left candle is closer than right candle)
    const remainder = timestamp % chart.timeframe;
    if (remainder < chart.timeframe / 2) {
      timestamp -= remainder;
    } else {
      timestamp += chart.timeframe - remainder;
    }

    const layerId = chart.getLayerByYCoord(y);
    const price = chart.getPriceByYCoord(y, layerId);

    this.timestamp = timestamp;
    this.price = Utils.toFixed(price, chart.maxDecimalPlaces);
  }
}
