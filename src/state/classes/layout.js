import EventEmitter from "../../events/event_emitter.ts";

import Utils from "../../utils";

// TODO move this to chart settings state
const settings = {
  xScaleHeight: 20,
  yScaleWidth: 50,
};

class ChartDimension {
  constructor(id, width, height) {
    this.id = id;
    this.width;
    this.height;
    this.main = {};
    this.xScale = {};
    this.yScale = {};

    this.setDimensions(width, height);
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.main = {
      width: width - settings.yScaleWidth,
      height: height - settings.xScaleHeight,
    };
    this.xScale = {
      width: width - settings.yScaleWidth,
      height: settings.xScaleHeight,
    };
    this.yScale = {
      width: settings.yScaleWidth,
      height: height - settings.xScaleHeight,
    };
  }
}

export default class LayoutState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.height = 0;
    this.width = 0;
    this.layout = {};
    this.chartDimensions = {};
  }

  init() {
    window.addEventListener("resize", this.resize.bind(this));
    setTimeout(this.resize.bind(this));
  }

  setInitialLayout(layout) {
    // If no layout, create default layout with one chart
    if (!layout.length) {
      const { id: chartId } = this.$global.createChart();
      layout = [
        {
          id: Utils.uniqueId(),
          chartId,
          top: 0,
          left: 0,
          width: 100,
          height: 100,
          children: [],
        },
      ];
    }

    this.setLayout(layout);
  }

  setLayout(layout) {
    this.layout = layout;
    this.fireEvent("set-layout", this.layout);
    this.$global.settings.onSetLayout(this.layout);
  }

  resize() {
    // Get the height and width of charts grid container
    const { current } = this.$global.ui.app.chartsElement;
    this.height = current.clientHeight;
    this.width = current.clientWidth;

    for (const chart of Object.values(this.chartDimensions)) {
      const { current } = this.$global.ui.charts[chart.id].chartContainer;
      if (current) {
        this.updateSize(chart.id, current.clientWidth, current.clientHeight);
      }
    }

    this.fireEvent("resize", {
      height: this.height,
      width: this.width,
    });
  }

  updateSize(id, width, height) {
    this.chartDimensions[id].setDimensions(width, height);
    this.fireEvent(`resize-${id}`, this.chartDimensions[id]);
  }

  addChart(id, width, height) {
    this.chartDimensions[id] = new ChartDimension(id, width, height);
  }
}
