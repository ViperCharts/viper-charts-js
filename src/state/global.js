import EventEmitter from "../events/event_emitter.ts";

import Utils from "../utils.js";
import Chart from "./classes/chart";
import LayoutState from "./classes/layout";
import CrosshairState from "./classes/crosshair";
import UIState from "./classes/ui";

class ChartState {
  constructor() {
    this.id = Utils.uniqueId();
    this.chart = new Chart();
  }
}

export default class GlobalState extends EventEmitter {
  constructor() {
    this.charts = new Map();
    this.layout = new LayoutState({ $global: this });
    this.crosshair = new CrosshairState({ $global: this });
    this.ui = new UIState({ $global: this });
  }

  createChart() {
    const chart = new ChartState({ $global: this });
    this.charts.set(chart.id, chart);
    return this.charts.get(chart.id);
  }
}
