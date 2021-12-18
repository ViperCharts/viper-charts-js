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

    console.log(res.data.set);

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

    const setCopy = {};

    // Loop through each set and dispatch instructions fetch
    for (const id in this.sets) {
      const set = this.sets[id];
      setCopy[id] = {
        data: set.data,
        max: set.max,
        min: set.min,
        decimalPlaces: set.decimalPlaces,
      };
    }

    const res = await this.$global.workers.dispatch({
      method: "generateInstructions",
      params: {},
    });

    this.max = max;
    this.min = min;
    const chart = this.$chart;
    chart.setRange({ min, max }, true);
    const instructions = {};
    const yScaleInstructions = {};
    let maxWidth = 0;

    // Calculate actual instructions
    for (const id in dataDictionaryCopy) {
      const data = dataDictionaryCopy[id];

      instructions[id] = {};
      const set = this.sets[id];

      for (const time in data) {
        const item = JSON.parse(JSON.stringify(data[time]));

        instructions[id][time] = [];

        const x = Utils.getXCoordByTimestamp(time);

        // Loop through all instructions for this time
        for (let i = 0; i < item.length; i++) {
          const { type, values } = item[i];
          const { series } = values;

          if (type === "line") {
            instructions[id][time].push({
              type: "line",
              x,
              y: Utils.getYCoordByPrice(series[0]),
              color: values.colors.color,
              linewidth: values.linewidth,
              ylabel: values.ylabel,
            });
          } else if (type === "box") {
            const y1 = Utils.getYCoordByPrice(series[0]);
            const y2 = Utils.getYCoordByPrice(series[1]);
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
            const y1 = Utils.getYCoordByPrice(series[0]);
            const y2 = Utils.getYCoordByPrice(series[1]);
            const y3 = Utils.getYCoordByPrice(series[2]);
            const y4 = Utils.getYCoordByPrice(series[3]);
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
          }
        }
      }

      const times = Object.keys(data);

      if (!data[times[times.length - 1]]) continue;

      // Get last time item and check if each item at time has ylabel set to true
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

          const val =
            this.$chart.settings.scaleType === "default"
              ? parseFloat(value).toFixed(set.decimalPlaces)
              : value;

          const text = `${symbol}${val}${extra}`;
          const { ctx } = this.$chart.subcharts.yScale.canvas;
          const textWidth = Math.ceil(ctx.measureText(text).width);

          if (textWidth > maxWidth) maxWidth = textWidth;

          const id = Utils.uniqueId();
          yScaleInstructions[id] = {
            type: "text",
            x: dimensions.yScale.width / 2,
            y,
            color: textColor,
            text,
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

    const chartDimensions = this.$global.layout.chartDimensions[this.$chart.id];
    const width = maxWidth + 12;

    // Check if max text width is different than yscale layout width
    if (chartDimensions.yScale.width !== width && width > 50) {
      chartDimensions.setYScaleWidth(width);
    }

    this.instructions.main = instructions;

    // Reset yScale
    for (const id in this.instructions.yScale) {
      this.$chart.subcharts.yScale.canvas.RE.removeFromRenderingOrder(id);
    }
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
