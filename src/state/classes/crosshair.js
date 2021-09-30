import EventEmitter from "../../events/event_emitter.ts";

class Crosshair extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.x = -1;
    this.y = -1;
    this.timestamp = -1;
    this.price = -1;
  }

  updateCrosshair(x, y) {
    this.y = y;

    // TODO TEMP: fixed crosshair but only works on first chart, refactor crosshair state to support multiple charts in future
    const chart = Array.from(this.$global.charts.values())[0];
    let timestamp = chart.getTimestampByXCoord(x);

    // Check if timestamp remainder is less than half a single timeframe unit
    // (that means left candle is closer than right candle)
    const remainder = timestamp % chart.timeframe;
    if (remainder < chart.timeframe / 2) {
      timestamp -= remainder;
      this.x = chart.getXCoordByTimestamp(timestamp);
    } else {
      timestamp += chart.timeframe - remainder;
      this.x = chart.getXCoordByTimestamp(timestamp);
    }

    const range = chart.range[3] - chart.range[2];
    const screenPerc = y / this.$global.layout.height.height;
    const rangeOffset = (1 - screenPerc) * range;
    const price = chart.range[2] + rangeOffset;

    this.timestamp = timestamp;
    this.price = Math.round(price);
    this.fireEvent("updateCrosshair", { x, y });
  }
}

export default class CrosshairState {
  constructor({ $global }) {
    this.$global = $global;

    this.crosshair = new Crosshair({ $global });
  }

  init() {}
}
