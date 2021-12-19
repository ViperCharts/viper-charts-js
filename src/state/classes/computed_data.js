import EventEmitter from "../../events/event_emitter.ts";
import Utils from "../../utils";

import ScriptFunctions from "../../viper_script/script_functions";

class ComputedSet {
  constructor(timeframe) {
    this.data = {};
    this.max = -Infinity;
    this.min = Infinity;
    this.timeframe = timeframe;
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

  calculateOneSet(key) {
    const { indicator, visible } = this.queue.get(key);
    const dataset = this.$chart.datasets[indicator.datasetId];

    // Delete old set TODO CHANGE THIS IT HURTS PERFORMANCE
    delete this.sets[key];

    // If indicator is set to invisible, dont calculate data
    if (!visible) return;

    let iteratedTime = 0;

    // Storage for global variables used across indicator times only defined once
    const globals = {};

    const funcWraps = {};
    for (const funcName in ScriptFunctions) {
      funcWraps[funcName] = function () {
        return ScriptFunctions[funcName](
          {
            renderingQueueId: key,
            chart: this.$chart,
            time: iteratedTime,
            dataset,
            globals,
          },
          ...arguments
        );
      }.bind(this);
    }

    // Loop through each visible item of dataset indicator is subscribed to
    const visibleData = this.$chart.visibleData[indicator.datasetId];
    if (!visibleData || !visibleData.data) return;

    // Run the indicator function for this candle and get all results
    for (const point of visibleData.data) {
      if (this.sets[key] && this.sets[key].data[point.time] !== undefined)
        continue;

      iteratedTime = point.time;

      indicator.drawFunc.bind(indicator)({
        ...point,
        ...funcWraps,
      });
    }
  }

  requestSetPoints({ id, start, end }) {
    const set = this.sets[id];

    if (!set) return;

    const { timeframe } = set;
    // Check all set items to see if they have been calculated
    for (const timestamp of Utils.getAllTimestampsIn(start, end, timeframe)) {
      if (set.data[timestamp] === undefined) {
        this.calculateOneSetTime(id, timestamp);
      }
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

  addSetItem(id, time, type, timeframe, values) {
    if (!this.sets[id]) {
      this.sets[id] = new ComputedSet(timeframe);
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
    const isPercent = this.$chart.settings.scaleType === "percent";
    const isNormalized = this.$chart.settings.scaleType === "normalized";

    let max = -Infinity;
    let min = Infinity;

    const dataDictionaryCopy = {};

    // Loop through all sets and set values and calculate min and max plotted values
    for (const id in this.sets) {
      const set = this.sets[id];
      dataDictionaryCopy[id] = JSON.parse(JSON.stringify(set.data));
      const data = dataDictionaryCopy[id];

      const [start, end] = this.$chart.range;
      const { timeframe } = this.$chart;

      for (const time of Utils.getAllTimestampsIn(start, end, timeframe)) {
        const item = data[time];

        if (!item) continue;

        for (let i = 0; i < item.length; i++) {
          const { values } = item[i];

          if (item[i].type === "volume") continue;

          // If percent, loop through all instructions at and loop through every value for each instruction
          // and compare it to starting value
          if (isPercent) {
            const firstInstructions = set.data[Object.keys(set.data)[0]];

            if (firstInstructions) {
              const { series: firstSeries } = firstInstructions[i].values;

              // TODO fix this so we dont compare EVERY value to start candle
              values.series = values.series.map((val, j) => {
                return Utils.toFixed(
                  ((val - firstSeries[j]) / firstSeries[j]) * 100,
                  2
                );
              });
            }
          }

          // If a normalized chart, every value is compared relatively to its own max and min (visible range);
          else if (isNormalized) {
            const range = set.max - set.min;

            values.series = values.series.map((val) =>
              Utils.maxNumberAndDecimal(((val - set.min) / range) * 100, 4)
            );
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
    const yScaleInstructions = {};

    // Calculate actual instructions
    for (const id in dataDictionaryCopy) {
      const data = dataDictionaryCopy[id];

      instructions[id] = {};
      const set = this.sets[id];

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
              ylabel: values.ylabel,
            });
          } else if (type === "box") {
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
          } else if (type === "candle") {
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
              ylabel: values.ylabel,
            });

            instructions[id][time].push({
              type: "single-line",
              x,
              y: y2,
              x2: x,
              y2: y3,
              color: values.colors.wickcolor,
            });
          } else if (type === "volume") {
            const volume = series[0];
            const w = chart.pixelsPerElement * 0.9;

            const { height } =
              this.$global.layout.chartDimensions[this.$chart.id].main;
            const maxHeight = 0.2 * height;
            const volumePerc = volume / set.max;
            const h = Math.floor(volumePerc * maxHeight);

            instructions[id][time].push({
              type: "box",
              x: x - w / 2,
              y: height - h,
              w: w,
              h,
              color: values.colors.color,
              ylabel: false,
            });
          }
        }
      }

      // Get last time item and check if each item at time has ylabel set to true
      const times = Object.keys(data);
      for (const item of data[times[times.length - 1]]) {
        const { type, values } = item;
        if (values.ylabel === true) {
          const value = values.series[{ line: 0, candle: 3 }[type]];

          const dimensions =
            this.$global.layout.chartDimensions[this.$chart.id];

          const y = chart.getYCoordByPrice(value);
          let textColor = Utils.isColorLight(values.colors.color)
            ? "#000"
            : "#FFF";

          const symbol = isPercent ? (value >= 0 ? "+" : "-") : "";
          const extra = isPercent ? "%" : "";

          const id = Utils.uniqueId();
          yScaleInstructions[id] = {
            type: "text",
            x: dimensions.yScale.width / 2,
            y,
            color: textColor,
            text: `${symbol}${Utils.maxNumberAndDecimal(value, 8)}${extra}`,
            font: "bold 10px Arial",
          };

          const id2 = Utils.uniqueId();
          yScaleInstructions[id2] = {
            type: "box",
            x: 0,
            y: y - 13,
            w: dimensions.yScale.width,
            h: 20,
            color: values.colors.color,
          };

          this.$chart.subcharts.yScale.canvas.RE.addToRenderingOrder(id, 1);
          this.$chart.subcharts.yScale.canvas.RE.addToRenderingOrder(id2, 1);
        }
      }
    }

    this.instructions.main = instructions;

    // Reset yScale
    for (const id in this.instructions.yScale) {
      this.$chart.subcharts.yScale.canvas.RE.removeFromRenderingOrder(id);
    }
    this.instructions.yScale = yScaleInstructions;
  }
}
