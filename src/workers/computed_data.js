import Utils from "../utils";
import Indicators from "../components/indicators";
import ScriptFunctions from "../viper_script/script_functions";

import EventEmitter from "../events/event_emitter";

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
    this.$state.calculateMaxDecimalPlaces();
  }
}

class MainThreadMessenger {
  constructor() {}

  addToRenderingOrder({}) {
    self.postMessage();
  }
}

export default class ComputedData extends EventEmitter {
  constructor() {
    super();

    this.mainThreadMessenger = new MainThreadMessenger();
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

    this.offsetX = 0;
    this.offsetY = 0;
  }

  calculateOneSet({ renderingQueueId, timestamps, dataset }) {
    const indicator = this.queue.get(renderingQueueId);
    indicator.draw = Indicators[indicator.id].draw;

    // If indicator is set to invisible, dont calculate data
    if (!indicator.visible) return;

    // Create a set if it doesnt exist
    if (!this.sets[renderingQueueId]) {
      this.sets[renderingQueueId] = new ComputedSet({
        $state: this,
        timeframe: dataset.timeframe,
      });
    }

    const set = this.sets[renderingQueueId];

    let iteratedTime = 0;

    // Storage for global variables used across indicator times only defined once
    const globals = {};

    const addSetItem = ((time, type, values) => {
      // If first plotted item at time, create fresh array
      if (!set.data[time]) set.data[time] = [];

      // Add plot type and plot values to time
      set.data[time].push({ type, values });

      // Update max & min if applicable
      const { series } = values;
      for (const val of series) {
        // Update min
        if (val < set.min) {
          set.min = val;
        }

        // Update max
        if (val > set.max) {
          set.max = val;
        }

        // If potential for more decimal places, check
        if (set.decimalPlaces < 8) {
          const decimalPlaces = Utils.getDecimalPlaces(val, 8);

          // If decimal places for number is larger, set max decimal places
          if (decimalPlaces > set.decimalPlaces) {
            set.setDecimalPlaces(decimalPlaces);
          }
        }
      }

      this.sets[renderingQueueId] = set;
    }).bind(this);

    const funcWraps = {};
    for (const funcName in ScriptFunctions) {
      funcWraps[funcName] = function () {
        return ScriptFunctions[funcName](
          {
            addSetItem,
            time: iteratedTime,
            timeframe: dataset.timeframe,
            data: dataset.data,
            globals,
            computedState: this.computedState[renderingQueueId],
          },
          ...arguments
        );
      }.bind(this);
    }

    // Run the indicator function for this candle and get all results
    for (const timestamp of timestamps) {
      iteratedTime = timestamp;

      // If item exists at iterated time, delete it
      delete set.data[iteratedTime];

      const point = dataset.data[iteratedTime];

      if (point === undefined || point === null) continue;

      indicator.draw({
        ...point,
        ...funcWraps,
      });
    }
  }

  addPixelInstructionsOffset({ newRange, oldRange, width, height }) {
    const newRangeWidth = newRange.end - newRange.start;
    const newRangeHeight = newRange.max - newRange.min;

    // Calculate percentage difference between widths
    const x = -((newRange.start - oldRange.start) / newRangeWidth) * width;
    const y = ((newRange.min - oldRange.min) / newRangeHeight) * height;

    this.offsetX += x;
    this.offsetY += y;
  }

  addToQueue({ indicator }) {
    let id = Utils.uniqueId();
    do {
      id = Utils.uniqueId();
    } while (this.queue.has(id));

    this.queue.set(id, indicator);

    return { renderingQueueId: id };
  }

  /**
   * Add instruction to set (aka: plot a value)
   * *Should only be called from script_functions, not from anywhere else
   * @param {string} id
   * @param {number} time
   * @param {string} type
   * @param {number} timeframe
   * @param {array} values
   */

  toggleVisibility(id) {
    if (!this.queue.has(id)) {
      console.error(`${id} was not found in rendering queue`);
      return;
    }

    const item = this.queue.get(id);
    item.visible = !item.visible;
    this.queue.set(id, item);

    // TODO dont delete sets or computed state only delete instructions
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

  generateAllInstructions({
    scaleType,
    visibleRange,
    timeframe,
    chartDimensions,
    pixelsPerElement,
  }) {
    const timestamps = Utils.getAllTimestampsIn(
      visibleRange.start,
      visibleRange.end,
      timeframe
    );

    const renderingQueueIds = Object.keys(this.sets);

    const allInstructions = {
      main: {},
      yScale: {},
      xScale: {},
    };

    // Loop through all sets and generate instructions based on them
    for (const renderingQueueId of renderingQueueIds) {
      const { instructions } = this.generateInstructions({
        renderingQueueId,
        timestamps,
        scaleType,
        visibleRange,
        timeframe,
        chartDimensions,
        pixelsPerElement,
      });

      allInstructions.main[renderingQueueId] = instructions.main;
    }

    return { allInstructions };
  }

  generateInstructions({
    renderingQueueId,
    timestamps,
    scaleType,
    visibleRange,
    timeframe,
    chartDimensions,
    pixelsPerElement,
  }) {
    const set = this.sets[renderingQueueId];

    const isPercent = scaleType === "percent";
    const isNormalized = scaleType === "normalized";

    let max = -Infinity;
    let min = Infinity;

    const vr = visibleRange;

    // TODO re-add min max calcs and bs

    const { main, yScale } = chartDimensions;

    const instructions = {
      main: {},
      yScale: {},
      xScale: {},
    };
    let maxWidth = 0;

    // Wrapper functions for getting coords using visible range
    const getXCoordByTimestamp = (ts) =>
      Utils.getXCoordByTimestamp(vr.start, vr.end, main.width, ts);
    const getYCoordByPrice = (p) =>
      Utils.getYCoordByPrice(vr.min, vr.max, main.height, p);

    // Loop through each timestamp of desired range and generate instructions for each plot point
    for (const time of timestamps) {
      const item = set.data[time];

      if (!item) continue;

      instructions.main[time] = [];

      const x = getXCoordByTimestamp(time);

      for (let i = 0; i < item.length; i++) {
        const { type, values } = item[i];
        const { series } = values;

        if (type === "line") {
          instructions.main[time].push({
            type: "line",
            x,
            y: getYCoordByPrice(series[0]),
            color: values.colors.color,
            linewidth: values.linewidth,
            ylabel: values.ylabel,
          });
        } else if (type === "box") {
          const y1 = getYCoordByPrice(series[0]);
          const y2 = getYCoordByPrice(series[1]);
          const w = pixelsPerElement * series[3];

          instructions.main[time].push({
            type: "box",
            x: x - w / 2,
            y: y1,
            w: w,
            h: Math.abs(y2) - Math.abs(y1),
            color: values.colors.color,
          });
        } else if (type === "candle") {
          const y1 = getYCoordByPrice(series[0]);
          const y2 = getYCoordByPrice(series[1]);
          const y3 = getYCoordByPrice(series[2]);
          const y4 = getYCoordByPrice(series[3]);
          const w = pixelsPerElement * 0.9;

          instructions.main[time].push({
            type: "box",
            x: x - w / 2,
            y: y1,
            w: w,
            h: Math.abs(y4) - Math.abs(y1),
            color: values.colors.color,
            ylabel: values.ylabel,
          });

          instructions.main[time].push({
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

    // this.max = max;
    // this.min = min;
    // this.$chart.range.min = min;
    // this.$chart.range.max = max;

    // const width = maxWidth + 12;

    // // Check if max text width is different than yscale layout width
    // if (chartDimensions.yScale.width !== width && width > 50) {
    //   chartDimensions.setYScaleWidth(width);
    // }

    // Reset yScale
    // for (const id in this.instructions.yScale) {
    //   this.$chart.subcharts.yScale.canvas.RE.removeFromRenderingOrder(id);
    // }

    // this.offsetX = 0;
    // this.offsetY = 0;

    return { instructions };
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

// for (const id in sets) {
//   const set = sets[id];
//   dataDictionaryCopy[id] = JSON.parse(JSON.stringify(set.data));
//   const data = dataDictionaryCopy[id];

//   for (const time of times) {
//     const item = data[time];

//     if (!item) continue;

//     for (let i = 0; i < item.length; i++) {
//       const { values } = item[i];

//       // If percent, loop through all instructions at and loop through every value for each instruction
//       // and compare it to starting value
//       if (isPercent) {
//         const firstInstructions = set.data[Object.keys(set.data)[0]];

//         if (firstInstructions) {
//           const { series: firstSeries } = firstInstructions[i].values;

//           // TODO fix this so we dont compare EVERY value to start candle
//           values.series = values.series.map((val, j) => {
//             return Utils.toFixed(
//               ((val - firstSeries[j]) / firstSeries[j]) * 100,
//               2
//             );
//           });
//         }
//       }

//       // If a normalized chart, every value is compared relatively to its own max and min (visible range);
//       else if (isNormalized) {
//         const range = set.max - set.min;

//         values.series = values.series.map((val) =>
//           Utils.toFixed(((val - set.min) / range) * 100, 4)
//         );
//       }

//       const { series } = values;

//       // Compute max plotted visible data
//       for (const value of series) {
//         if (value > max) {
//           max = value;
//         }
//         if (value < min) {
//           min = value;
//         }
//       }
//     }
//   }
// }

// CALCUALTE Y LABEL INSTRUICTIONS TODO REFACTOR THIS GARBAGE

// const times = Object.keys(data);

//       if (!data[times[times.length - 1]]) continue;

//       // Get last time item and check if each item at time has ylabel set to true
//       for (const item of data[times[times.length - 1]]) {
//         const { type, values } = item;
//         if (values.ylabel === true) {
//           const value = values.series[{ line: 0, candle: 3 }[type]];

//           const y = getYCoordByPrice(value);
//           let textColor = Utils.isColorLight(values.colors.color)
//             ? "#000"
//             : "#FFF";

//           const symbol = isPercent ? (value >= 0 ? "+" : "-") : "";
//           const extra = isPercent ? "%" : "";

//           const val =
//             scaleType === "default"
//               ? parseFloat(value).toFixed(set.decimalPlaces)
//               : value;

//           const text = `${symbol}${val}${extra}`;
//           // const { ctx } = this.$chart.subcharts.yScale.canvas;
//           // const textWidth = Math.ceil(ctx.measureText(text).width);
//           const textWidth = text.length * 3;

//           if (textWidth > maxWidth) maxWidth = textWidth;

//           const id = Utils.uniqueId();
//           yScaleInstructions[id] = {
//             type: "text",
//             x: yScale.width / 2,
//             y,
//             color: textColor,
//             text,
//             font: "bold 10px Arial",
//           };

//           const id2 = Utils.uniqueId();
//           yScaleInstructions[id2] = {
//             type: "box",
//             x: 0,
//             y: y - 13,
//             w: yScale.width,
//             h: 20,
//             color: values.colors.color,
//           };

//           // this.$chart.subcharts.yScale.canvas.RE.addToRenderingOrder(id, 1);
//           // this.$chart.subcharts.yScale.canvas.RE.addToRenderingOrder(id2, 1);
//         }
//       }
