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

    // This state
    this.selectedChartId = null;
    this.api = null;

    // Child states
    this.charts = {};
    this.settings = new SettingsState({ $global: this });
    this.crosshair = new CrosshairState({ $global: this });
    this.ui = new UIState({ $global: this });
    this.layout = new LayoutState({ $global: this });
    this.data = new DataState({ $global: this });
    this.events = new EventsState({ $global: this });

    window.deleteSelectedChart = this.deleteSelectedChart.bind(this);
  }

  init() {
    this.settings.init();
    this.crosshair.init();
    this.ui.init();
    this.layout.init();
    this.data.init();
    this.events.init();
  }

  createChart(state = {}) {
    const chart = new ChartState({ ...state, $global: this });
    this.charts[chart.id] = chart;
    this.ui.app.addChart(chart);
    this.setSelectedChartId(chart.id);
    return this.charts[chart.id];
  }

  deleteSelectedChart() {
    if (Object.keys(this.charts).length === 1) return;
    const id = this.selectedChartId;
    const chart = this.charts[id];
    chart.destroy();
    this.setSelectedChartId(Object.keys(this.charts)[0]);
  }

  setSelectedChartId(id) {
    this.selectedChartId = id;
    this.fireEvent("set-selected-chart-id", id);
  }
}

export default new GlobalState();
