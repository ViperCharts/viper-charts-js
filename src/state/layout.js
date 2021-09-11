import EventEmitter from "../events/event_emitter.ts";

class Height extends EventEmitter {
  constructor() {
    super();
    this.height = 0;
  }

  setHeight(height) {
    this.height = height;
    this.fireEvent("setHeight", height);
  }
}

class Width extends EventEmitter {
  constructor() {
    super();
    this.width = 0;
  }

  setWidth(width) {
    this.width = width;
    this.fireEvent("setWidth", width);
  }
}

class LayoutState {
  constructor() {
    this.height = new Height();
    this.width = new Width();
  }
}

export default new LayoutState();
