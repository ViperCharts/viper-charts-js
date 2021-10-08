import EventEmitter from "../events/event_emitter.ts";

import ChartState from "./classes/chart";
import LayoutState from "./classes/layout";
import CrosshairState from "./classes/crosshair";
import UIState from "./classes/ui";
import DataState from "./classes/data";
import EventsState from "./classes/events";
import SettingsState from "./classes/settings";

class GlobalState extends EventEmitter {
  constructor() {
    super();
    this.selectedChartId = null;
    this.charts = {};
    this.settings = new SettingsState({ $global: this });
    this.crosshair = new CrosshairState({ $global: this });
    this.ui = new UIState({ $global: this });
    this.layout = new LayoutState({ $global: this });
    this.data = new DataState({ $global: this });
    this.events = new EventsState({ $global: this });
  }

  init() {
    this.settings.init();
    this.crosshair.init();
    this.ui.init();
    this.layout.init();
    this.data.init();
    this.events.init();
  }

  createChart() {
    const chart = new ChartState({ $global: this });
    this.charts[chart.id] = chart;
    this.ui.app.addChart(chart);
    this.selectedChartId = chart.id;
    return this.charts[chart.id];
  }

  setSelectedChartId(id) {
    this.selectedChartId = id;
    this.fireEvent("set-selected-chart-id", id);
  }
}

export default new GlobalState();
