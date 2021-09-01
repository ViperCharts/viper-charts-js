import EventEmitter from "../../events/event_emitter.ts";
import chartState from "../../state/chart.js";

export default class Crosshair extends EventEmitter {
  constructor() {
    super();
    this.x = -1;
    this.y = -1;
  }

  updateCrosshair(x, y) {
    this.y = y;

    const timestamp = chartState.getTimestampByXCoord(x);

    // Check if timestamp remainder is less than half a single timeframe unit
    // (that means left candle is closer than right candle)
    const remainder = timestamp % chartState.timeframe;
    if (remainder < chartState.timeframe / 2) {
      this.x = chartState.getXCoordByTimestamp(timestamp - remainder);
    } else {
      this.x = chartState.getXCoordByTimestamp(
        timestamp + chartState.timeframe - remainder
      );
    }

    this.fireEvent("updateCrosshair", { x, y });
  }
}
