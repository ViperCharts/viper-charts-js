import chartState from "../state/chart.js";
import layoutState from "../state/layout.js";

import Main from "./main.js";
import TimeScale from "../components/canvas_components/time_scale.js";

export default class Chart {
  constructor({ data, element, height, width }) {
    layoutState.height.setHeight(height);
    layoutState.width.setWidth(width);

    chartState.data = data;
    chartState.chart = this;
    element.style.position = "relative";
    element.style.width = "100%";
    element.style.height = "100%";
    chartState.chartParentElement = element;

    this.chartState = chartState;

    this.subcharts = {
      main: new Main(),
      xScale: new TimeScale(),
      yScale: undefined,
    };
  }

  setWidth(width) {
    layoutState.width.setWidth(width);
  }

  setHeight(height) {
    layoutState.height.setHeight(height);
  }
}
