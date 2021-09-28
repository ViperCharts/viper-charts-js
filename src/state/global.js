import EventEmitter from "../events/event_emitter.ts";

import ChartState from "./classes/chart";
import LayoutState from "./classes/layout";
import CrosshairState from "./classes/crosshair";
import UIState from "./classes/ui";

class GlobalState extends EventEmitter {
  constructor() {
    super();
    this.charts = new Map();
    this.crosshair = new CrosshairState({ $global: this });
    this.ui = new UIState({ $global: this });
    this.layout = new LayoutState({ $global: this });
    this.layout.init();
  }

  createChart() {
    const chart = new ChartState({ $global: this });
    this.charts.set(chart.id, chart);
    this.ui.addChart(chart);
    return this.charts.get(chart.id);
  }
}

export default new GlobalState();
