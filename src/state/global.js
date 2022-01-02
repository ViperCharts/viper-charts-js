import EventEmitter from "../events/event_emitter";

import ChartState from "./classes/chart";
import LayoutState from "./classes/layout";
import CrosshairState from "./classes/crosshair";
import UIState from "./classes/ui";
import DataState from "./classes/data";
import EventsState from "./classes/events";
import SettingsState from "./classes/settings";
import WorkerState from "./classes/workers";

export default class GlobalState extends EventEmitter {
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
    this.workers = new WorkerState({ $global: this });

    window.deleteSelectedChart = this.deleteSelectedChart.bind(this);
  }

  async init() {
    this.settings.init();
    this.crosshair.init();
    await this.ui.init();
    this.layout.init();
    this.data.init();
    this.events.init();
    this.workers.init();
  }

  createChart(state = {}) {
    const chart = new ChartState({
      name: "Untitled Chart",
      ...state,
      $global: this,
    });
    this.charts[chart.id] = chart;
    this.ui.app.addChart(chart);
    this.setSelectedChartId(chart.id);
    this.fireEvent("charts-change", this.charts);
    return this.charts[chart.id];
  }

  deleteSelectedChart() {
    if (Object.keys(this.charts).length === 1) return;
    const id = this.selectedChartId;
    const chart = this.charts[id];
    chart.destroy();
    this.setSelectedChartId(Object.keys(this.charts)[0]);
    this.fireEvent("charts-change", this.charts);
  }

  setSelectedChartId(id) {
    this.selectedChartId = id;
    this.fireEvent("set-selected-chart-id", id);
  }
}
