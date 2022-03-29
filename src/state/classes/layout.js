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
      layers: {},
    };
    this.xScale.width = width - this.yScale.width;
    this.yScale.height = height - this.xScale.height;

    const { overlays } = this.$global.charts[this.id];
    let top = 0;
    for (const id in overlays) {
      this.main.layers[id] = {
        top,
        height: this.main.height * (overlays[id].heightPerc / 100),
      };
      top += this.main.layers[id].height;
    }
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

  /**
   * Box or chart id
   * @param {string} id Box id or chart id
   * @param {string} side
   * @param {number} newSidePercent
   * @param {object} chartState
   * @returns
   */
  addChartBoxToSide(id, side, newSidePercent = 50, chartState = {}) {
    // Find the box by id
    const loop = (box) => {
      if (box.id === id || box.chartId === id) return box;
      for (const child of box.children) {
        const box = loop(child);
        if (box) return box;
      }
    };

    const box = loop(this.layout[0]);
    if (!box) {
      console.error(
        `No box with box id of chart id of ${id} found in layout config`
      );
      return;
    }

    const box1 = {
      id: Utils.uniqueId(),
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      chartId: box.chartId,
      children: [],
    };
    const box2 = {
      side,
      id: Utils.uniqueId(),
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      children: [],
    };

    const oldSidePercent = 100 - newSidePercent;

    if (side === "left") {
      box1.side = "right";
      box1.left = oldSidePercent;
      box1.width = oldSidePercent;
      box2.width = newSidePercent;
    } else if (side === "top") {
      box1.side = "bottom";
      box1.top = oldSidePercent;
      box1.height = oldSidePercent;
      box2.height = newSidePercent;
    } else if (side === "right") {
      box1.side = "left";
      box2.left = oldSidePercent;
      box1.width = oldSidePercent;
      box2.width = newSidePercent;
    } else if (side === "bottom") {
      box1.side = "top";
      box2.top = oldSidePercent;
      box1.height = oldSidePercent;
      box2.height = newSidePercent;
    }

    const chart = this.$global.createChart(chartState);
    box2.chartId = chart.id;
    delete box.chartId;

    if (side === "top" || side === "left") {
      box.children = [box2, box1];
    } else {
      box.children = [box1, box2];
    }

    this.setLayout(this.layout);

    return { box, box1, box2, chart };
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
