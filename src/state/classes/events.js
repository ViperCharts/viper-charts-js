import EventEmitter from "../../events/event_emitter";

export default class EventsState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;
  }

  init() {
    window.addEventListener("mousedown", this.onMouseDown.bind(this));
    window.addEventListener("mouseup", this.onMouseUp.bind(this));
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
  }

  onMouseDown(e) {
    this.fireEvent("mousedown", e);
  }

  onMouseUp(e) {
    this.fireEvent("mouseup", e);
  }

  onMouseMove(e) {
    this.fireEvent("mousemove", e);
  }
}
