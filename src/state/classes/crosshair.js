import EventEmitter from "../../events/event_emitter.ts";

export default class Crosshair extends EventEmitter {
  constructor() {
    super();
    this.x = -1;
    this.y = -1;
  }

  updateCrosshair(x, y) {
    this.x = x;
    this.y = y;
    this.fireEvent("updateCrosshair", { x, y });
  }
}
