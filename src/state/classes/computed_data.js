import EventEmitter from "../../events/event_emitter.ts";
import Utils from "../../utils";

import ScriptFunctions from "../../viper_script/script_functions";

class ComputedSet {
  constructor() {
    this.data = {};
    this.max = 0;
    this.min = Infinity;
  }
}

export default class ComputedData extends EventEmitter {
  constructor({ $global, $chart }) {
    super();

    this.$global = $global;
    this.$chart = $chart;

    this.queue = new Map();
    this.sets = {};
    this.max = -Infinity;
    this.min = Infinity;
    this.instructions = {};
  }

  calculateAllSets() {
    // Loop through each indicator and build sets for its plotted data
    Array.from(this.queue.keys()).forEach(this.calculateOneSet.bind(this));
    this.generateInstructions();
  }

  calculateOneSet(key) {
    const { indicator, visible } = this.queue.get(key);

    // If indicator is set to invisible, dont calculate data
    if (!visible) return;

    delete this.sets[key];

    let iteratedTime = 0;

    const funcWraps = {};
    for (const funcName in ScriptFunctions) {
      funcWraps[funcName] = function () {
        ScriptFunctions[funcName](
          {
            renderingQueueId: key,
            chart: this.$chart,
            time: iteratedTime,
          },
          ...arguments
        );
      }.bind(this);
    }

    // Loop through each visible item of dataset indicator is subscribed to
    const visibleData = this.$chart.visibleData[indicator.datasetId];

    // Run the indicator function for this candle and get all results
    for (const point of visibleData.data) {
      iteratedTime = point.time;

      indicator.drawFunc.bind(indicator)({
        ...point,
        ...funcWraps,
      });
    }
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
  }

  removeFromQueue(id) {
    if (!this.queue.has(id)) {
      console.error(`${id} was not found in rendering queue`);
      return false;
    }

    const { canvas } = this.$chart.subcharts.main;
    canvas.RE.removeFromRenderingOrder(id);
    this.queue.delete(id);

    return true;
  }

  addSetItem(id, time, type, values) {
    if (!this.sets[id]) {
      this.sets[id] = new ComputedSet();
    }

    const set = this.sets[id];
    if (!set.data[time]) set.data[time] = [{ type, values }];
    else set.data[time].push({ type, values });

    // Update max & min if applicable
    const { series } = values;
    for (const val of series) {
      if (val < set.min) {
        set.min = val;
      }
      if (val > set.max) {
        set.max = val;
      }
    }

    this.sets[id] = set;
  }

  generateInstructions() {
    // TODO queue this and debounce it

    let max = -Infinity;
    let min = Infinity;

    const dataDictionaryCopy = {};

    // Loop through all sets and set values and calculate min and max plotted values
    for (const id in this.sets) {
      const set = this.sets[id];
      dataDictionaryCopy[id] = JSON.parse(JSON.stringify(set.data));
      const data = dataDictionaryCopy[id];

      for (const time in data) {
        const item = data[time];

        for (let i = 0; i < item.length; i++) {
          const { values } = item[i];

          // If percent, loop through all instructions at and loop through every value for each instruction
          // and compare it to starting value
          if (this.$chart.settings.scaleType === "percent") {
            const firstInstructions = set.data[Object.keys(set.data)[0]];

            if (firstInstructions) {
              const { series: firstSeries } = firstInstructions[i].values;

              // TODO fix this so we dont compare EVERY value to start candle
              values.series = values.series.map((val, j) => {
                return ((val - firstSeries[j]) / firstSeries[j]) * 100;
              });
            }
          }

          const { series } = values;

          // Compute max plotted visible data
          for (const value of series) {
            if (value > max) {
              max = value;
            }
            if (value < min) {
              min = value;
            }
          }
        }
      }
    }

    this.max = max;
    this.min = min;
    const chart = this.$chart;
    chart.setRange({ min, max }, true);
    const instructions = {};

    // Calculate actual instructions
    for (const id in dataDictionaryCopy) {
      const data = dataDictionaryCopy[id];

      instructions[id] = {};

      for (const time in data) {
        const item = JSON.parse(JSON.stringify(data[time]));

        instructions[id][time] = [];

        const x = chart.getXCoordByTimestamp(time);

        // Loop through all instructions for this time
        for (let i = 0; i < item.length; i++) {
          const { type, values } = item[i];
          const { series } = values;

          if (type === "line") {
            instructions[id][time].push({
              type: "line",
              x,
              y: chart.getYCoordByPrice(series[0]),
              color: values.colors.color,
              linewidth: values.linewidth,
            });
          }

          if (type === "box") {
            const y1 = chart.getYCoordByPrice(series[0]);
            const y2 = chart.getYCoordByPrice(series[1]);
            const w = chart.pixelsPerElement * series[3];

            instructions[id][time].push({
              type: "box",
              x: x - w / 2,
              y: y1,
              w: w,
              h: Math.abs(y2) - Math.abs(y1),
              color: values.colors.color,
            });
          }

          if (type === "candle") {
            const y1 = chart.getYCoordByPrice(series[0]);
            const y2 = chart.getYCoordByPrice(series[1]);
            const y3 = chart.getYCoordByPrice(series[2]);
            const y4 = chart.getYCoordByPrice(series[3]);
            const w = chart.pixelsPerElement * 0.9;

            instructions[id][time].push({
              type: "box",
              x: x - w / 2,
              y: y1,
              w: w,
              h: Math.abs(y4) - Math.abs(y1),
              color: values.colors.color,
            });

            instructions[id][time].push({
              type: "single-line",
              x,
              y: y2,
              x2: x,
              y2: y3,
              color: values.colors.wickcolor,
            });
          }
        }
      }
    }

    this.instructions = instructions;
  }
}
