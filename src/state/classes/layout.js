import EventEmitter from "../../events/event_emitter";

import Utils from "../../utils";

// TODO move this to chart settings state
const settings = {
  xScaleHeight: 20,
  yScaleWidth: 50,
};

class ChartDimension {
  constructor($global, id, width, height) {
    this.$global = $global;
    this.id = id;
    this.width;
    this.height;
    this.main = {};
    this.xScale = {
      width: width - settings.yScaleWidth,
      height: settings.xScaleHeight,
    };
    this.yScale = {
      width: settings.yScaleWidth,
      height: height - settings.xScaleHeight,
    };

    this.setDimensions(width, height);
  }

  setDimensions(width, height) {
    this.width = width;
    this.height = height;
    this.main = {
      width: width - this.yScale.width,
      height: height - this.xScale.height,
    };
    this.xScale.width = width - this.yScale.width;
    this.yScale.height = height - this.xScale.height;
  }

  setYScaleWidth(width) {
    this.yScale.width = width;
    this.xScale.width = this.width - width;
    this.main.width = this.width - width;
    this.$global.layout.fireEvent(`resize-y-scale-${this.id}`, this);
  }
}

export default class LayoutState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.height = 0;
    this.width = 0;
    this.layout = [];
    this.chartDimensions = {};
  }

  init() {
    this.resizeListener = this.resize.bind(this);
    window.addEventListener("resize", this.resizeListener);
    setTimeout(this.resizeListener);
  }

  destroy() {
    window.removeEventListener("resize", this.resizeListener);
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

  removeChart(chartId) {
    // Loop through all layout boxes till finding the chartId
    const loop = (parent, child) => {
      if (child.chartId === chartId) {
        return { parent, child };
      }
      if (child.children) {
        for (const grandchild of child.children) {
          const result = loop(child, grandchild);
          if (result) return result;
        }
      }
    };

    const { layout } = this;
    const { parent, child } = loop(layout, layout[0]);

    const i = parent.children.indexOf(child);
    const childStaying = parent.children[Number(!i)];
    parent.chartId = childStaying.chartId;
    parent.children = childStaying.children;

    this.setLayout(layout);
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
    this.chartDimensions[id] = new ChartDimension(
      this.$global,
      id,
      width,
      height
    );
  }
}
