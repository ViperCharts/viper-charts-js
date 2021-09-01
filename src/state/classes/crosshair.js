import EventEmitter from "../../events/event_emitter.ts";
import chartState from "../../state/chart.js";

export default class Crosshair extends EventEmitter {
  constructor() {
    super();
    this.x = -1;
    this.y = -1;
    this.timestamp = -1;
  }

  updateCrosshair(x, y) {
    this.y = y;

    let timestamp = chartState.getTimestampByXCoord(x);

    // Check if timestamp remainder is less than half a single timeframe unit
    // (that means left candle is closer than right candle)
    const remainder = timestamp % chartState.timeframe;
    if (remainder < chartState.timeframe / 2) {
      timestamp -= remainder;
      this.x = chartState.getXCoordByTimestamp(timestamp);
    } else {
      timestamp += chartState.timeframe - remainder;
      this.x = chartState.getXCoordByTimestamp(timestamp);
    }

    this.timestamp = timestamp;
    this.fireEvent("updateCrosshair", { x, y });
  }
}
