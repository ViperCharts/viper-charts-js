import Main from "./main.js";

import chartState from "../state/chart.js";
import TimeScale from "../components/canvas_components/time_scale.js";

export default class Chart {
  constructor({ data, element }) {
    chartState.data = data;
    chartState.chartParentElement = element;
    chartState.chartParentElement.style.background = "#000";

    this.chartState = chartState;

    this.subcharts = {
      main: new Main(),
      xScale: new TimeScale(),
      yScale: undefined,
    };

    this.init();
  }

  init() {
    window.addEventListener("resize", () => {
      this.subcharts.main.canvas.setHeight(window.innerHeight - 60);
      this.subcharts.main.canvas.setWidth(window.innerWidth);
      this.subcharts.main.canvas.RE.draw();
      this.subcharts.xScale.canvas.setWidth(window.innerWidth);
      chartState.resizeXRange(0, window.innerWidth);
    });
  }
}
