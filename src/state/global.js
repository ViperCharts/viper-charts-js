import EventEmitter from "../events/event_emitter.ts";

import ChartState from "./classes/chart";
import LayoutState from "./classes/layout";
import CrosshairState from "./classes/crosshair";
import UIState from "./classes/ui";
import DataState from "./classes/data";

class GlobalState extends EventEmitter {
  constructor() {
    super();
    this.selectedChartId = null;
    this.charts = new Map();
    this.crosshair = new CrosshairState({ $global: this });
    this.ui = new UIState({ $global: this });
    this.layout = new LayoutState({ $global: this });
    this.data = new DataState({ $global: this });
  }

  init() {
    this.crosshair.init();
    this.ui.init();
    this.layout.init();
    this.data.init();
  }

  createChart() {
    const chart = new ChartState({ $global: this });
    this.charts.set(chart.id, chart);
    this.ui.app.addChart(chart);
    this.selectedChartId = chart.id;
    return this.charts.get(chart.id);
  }
}

export default new GlobalState();
