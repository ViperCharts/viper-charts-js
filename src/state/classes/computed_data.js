import EventEmitter from "../../events/event_emitter.ts";
import Utils from "../../utils";

import ScriptFunctions from "../../viper_script/script_functions";

class ComputedSet {
  constructor({
    $state,
    timeframe,
    data = {},
    max = -Infinity,
    min = Infinity,
  }) {
    this.$state = $state;

    this.data = data;
    this.max = max;
    this.min = min;
    this.timeframe = timeframe;
    this.decimalPlaces = 0;
  }

  setDecimalPlaces(decimalPlaces) {
    this.decimalPlaces = decimalPlaces;
    this.$state.computedData.calculateMaxDecimalPlaces();
  }
}

export default class ComputedData extends EventEmitter {
  constructor({ $global, $chart }) {
    super();

    this.$global = $global;
    this.$chart = $chart;

    this.queue = new Map();
    this.sets = {};
    this.computedState = {};
    this.max = -Infinity;
    this.min = Infinity;
    this.maxDecimalPlaces = 0;
    this.instructions = {
      main: {},
      yScale: {},
      xScale: {},
    };
  }

  calculateAllSets() {
    // Loop through each indicator and build sets for its plotted data
    Array.from(this.queue.keys()).forEach(this.calculateOneSet.bind(this));
    this.generateInstructions();
  }

  async calculateOneSet(key) {
    const { indicator, visible } = this.queue.get(key);
    const dataset = this.$chart.datasets[indicator.datasetId];

    // Delete old set TODO CHANGE THIS IT HURTS PERFORMANCE

    // If indicator is set to invisible, dont calculate data
    if (!visible) return;

    // Loop through each visible item of dataset indicator is subscribed to
    const visibleData = this.$chart.visibleData[indicator.datasetId];
    if (!visibleData || !visibleData.data) return;

    // Get the indicator name
    const { id: indicatorName } = this.$chart.indicators[key];

    const res = await this.$global.workers.dispatch({
      method: "calculateOneSet",
      params: {
        indicatorName,
        visibleData,
        datasetData: dataset.data,
        timeframe: dataset.timeframe,
        computedState: this.computedState[key] || {},
      },
    });

    const { data, max, min, decimalPlaces } = res.data.set;

    this.sets[key] = new ComputedSet({
      $state: this.$chart,
      timeframe: dataset.timeframe,
      data,
      max,
      min,
    });

    this.sets[key].setDecimalPlaces(decimalPlaces);
  }

  addToQueue(indicator, index) {
    let id = Utils.uniqueId();
    do {
      id = Utils.uniqueId();
    } while (this.queue.has(id));

    this.queue.set(id, {
      indicator,
      visible: true,
    });

    const { canvas } = this.$chart.subcharts.main;
    canvas.RE.addToRenderingOrder(id);

    return id;
  }

  toggleVisibility(id) {
    if (!this.queue.has(id)) {
      console.error(`${id} was not found in rendering queue`);
      return;
    }

    const item = this.queue.get(id);
    item.visible = !item.visible;
    this.queue.set(id, item);
    delete this.sets[id];
    delete this.computedState[id];
  }

  removeFromQueue(id) {
    if (!this.queue.has(id)) {
      console.error(`${id} was not found in rendering queue`);
      return false;
    }

    const { canvas } = this.$chart.subcharts.main;
    canvas.RE.removeFromRenderingOrder(id);
    this.queue.delete(id);
    delete this.sets[id];
    delete this.computedState[id];

    return true;
  }

  // addSetItem(id, time, type, timeframe, values) {
  //   if (!this.sets[id]) {
  //     this.sets[id] = new ComputedSet({ $state: this.$chart, timeframe });
  //   }

  //   const set = this.sets[id];
  //   if (!set.data[time]) set.data[time] = [{ type, values }];
  //   else set.data[time].push({ type, values });

  //   this.sets[id] = set;
  // }

  async generateInstructions() {
    const { scaleType } = this.$chart.settings;

    const sets = {};

    // Loop through each set and dispatch instructions fetch
    for (const id in this.sets) {
      const set = this.sets[id];
      sets[id] = {
        data: set.data,
        max: set.max,
        min: set.min,
        decimalPlaces: set.decimalPlaces,
      };
    }

    const chartDimensions = this.$global.layout.chartDimensions[this.$chart.id];

    const res = await this.$global.workers.dispatch({
      method: "generateInstructions",
      params: {
        scaleType,
        sets,
        timeframe: this.$chart.timeframe,
        chartDimensions: {
          main: chartDimensions.main,
          yScale: chartDimensions.yScale,
          xScale: chartDimensions.xScale,
        },
        pixelsPerElement: this.$chart.pixelsPerElement,
        visibleRange: {
          start: this.$chart.range[0],
          end: this.$chart.range[1],
          min: this.$chart.range[2],
          max: this.$chart.range[3],
        },
      },
    });

    const { min, max, maxWidth, instructions, yScaleInstructions } = res.data;

    console.log(instructions);

    this.max = max;
    this.min = min;
    this.$chart.setRange({ min, max }, true);

    const width = maxWidth + 12;

    // Check if max text width is different than yscale layout width
    if (chartDimensions.yScale.width !== width && width > 50) {
      chartDimensions.setYScaleWidth(width);
    }

    this.instructions.main = instructions;

    // Reset yScale
    // for (const id in this.instructions.yScale) {
    //   this.$chart.subcharts.yScale.canvas.RE.removeFromRenderingOrder(id);
    // }
    this.instructions.yScale = yScaleInstructions;
  }

  calculateMaxDecimalPlaces() {
    let maxDecimalPlaces = 0;
    for (const { decimalPlaces } of Object.values(this.sets)) {
      if (decimalPlaces > maxDecimalPlaces) {
        maxDecimalPlaces = decimalPlaces;
      }
    }
    this.maxDecimalPlaces = maxDecimalPlaces;
  }
}
