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

    // let timestamp = chartState.getTimestampByXCoord(x);

    // TODO: fix this crosshair code
    // Check if timestamp remainder is less than half a single timeframe unit
    // (that means left candle is closer than right candle)
    // const remainder = timestamp % chartState.timeframe;
    // if (remainder < chartState.timeframe / 2) {
    //   timestamp -= remainder;
    //   this.x = chartState.getXCoordByTimestamp(timestamp);
    // } else {
    //   timestamp += chartState.timeframe - remainder;
    //   this.x = chartState.getXCoordByTimestamp(timestamp);
    // }

    // const range = chartState.range[3] - chartState.range[2];
    // const screenPerc = y / this.height.height;
    // const rangeOffset = (1 - screenPerc) * range;
    // const price = chartState.range[2] + rangeOffset;

    // this.timestamp = timestamp;
    // this.price = Math.round(price);
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
