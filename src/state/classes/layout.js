import EventEmitter from "../../events/event_emitter.ts";

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

export default class LayoutState {
  constructor({ $global }) {
    this.$global = $global;

    this.height = new Height();
    this.width = new Width();
  }

  init() {
    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
  }

  resize() {
    // TODO Fix resize
    // const container = this.$global.ui.chartsElements;
    // this.width.setWidth(container.clientWidth);
    // this.height.setHeight(container.clientHeight);
  }
}
