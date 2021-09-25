import EventEmitter from "../events/event_emitter.ts";

import chartState from "../state/chart.js";
import uiState from "../state/ui.js";

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

    this.init();
  }

  init() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  resize() {
    const container = uiState.chartsElements;
    this.width.setWidth(container.clientWidth);
    this.height.setHeight(container.clientHeight);
  }
}

export default new LayoutState();
