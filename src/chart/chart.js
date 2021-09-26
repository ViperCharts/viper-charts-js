import chartState from "../state/chart.js";
import layoutState from "../state/layout.js";
import uiState from "../state/ui.js";

export default class Chart {
  constructor({ data, element }) {
    chartState.data = data;
    chartState.chart = this;
    this.createLayout(element);

    this.chartState = chartState;
    chartState.init();
  }

  createLayout() {
    layoutState.resize();
    chartState.setInitialVisibleRange(
      layoutState.height.height - 20,
      layoutState.width.width - 50
    );
  }
}
