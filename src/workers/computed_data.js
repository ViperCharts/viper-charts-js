import Utils from "../utils";
import Indicators from "../components/indicators";
import ScriptFunctions from "../viper_script/script_functions";
import Constants from "../constants";

import EventEmitter from "../events/event_emitter";

class ComputedSet {
  constructor({ $state, timeframe, data = {} }) {
    this.$state = $state;

    this.data = data;
    this.timeframe = timeframe;
    this.decimalPlaces = 0;
    this.maxLookback = 0;
    this.maxLookforward = 0;
  }

  setDecimalPlaces(decimalPlaces) {
    this.decimalPlaces = decimalPlaces;
    this.$state.calculateMaxDecimalPlaces();
  }

  addLookback(lookback) {
    if (lookback === 0) return;
    // If lookback is positive, means we are looking back and if greater than historical lookback
    if (lookback > 0 && lookback > this.maxLookback) {
      this.maxLookback = lookback;
    }
    // If lookback is negative, means we are looking forward and if less than historial lookforward
    if (lookback < 0 && lookback < -this.maxLookforward) {
      this.maxLookforward = -lookback;
    }
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
    const { timeframe } = dataset;

    const indicator = this.queue.get(renderingQueueId);
    indicator.draw = Indicators[indicator.id].draw;

    // If indicator is set to invisible, dont calculate data
    if (!indicator.visible) return;

    // Create a set if it doesnt exist
    if (!this.sets[renderingQueueId]) {
      this.sets[renderingQueueId] = new ComputedSet({
        $state: this,
        timeframe,
      });
    }

    const set = this.sets[renderingQueueId];

    // Check if set has requires lookback or lookforwardw
    if (set.maxLookback) {
      const last = +timestamps[timestamps.length - 1];
      const start = last + timeframe;
      const end = last + timeframe * set.maxLookback;
      console.log(start, end);
      timestamps = [
        ...timestamps,
        ...Utils.getAllTimestampsIn(start, end, timeframe),
      ];
    }
    if (set.maxLookforward) {
      const first = +timestamps[0];
      const start = first - timeframe * set.maxLookforward;
      const end = first - timeframe;
      timestamps = [
        ...Utils.getAllTimestampsIn(start, end, timeframe),
        ...timestamps,
      ];
    }

    let iteratedTime = 0;

    // Storage for global variables used across indicator times only defined once
    const globals = {};

    const addSetItem = ((time, type, values) => {
      // If first plotted item at time, create fresh array
      set.data[time] = [];

      // Add plot type and plot values to time
      set.data[time].push({ type, values });

      // Update max & min if applicable
      const { series } = values;
      for (const val of series) {
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

    if (!this.computedState[renderingQueueId]) {
      this.computedState[renderingQueueId] = {};
    }

    const funcWraps = {};
    for (const funcName in ScriptFunctions) {
      funcWraps[funcName] = function () {
        return ScriptFunctions[funcName](
          {
            set,
            addSetItem,
            time: iteratedTime,
            timeframe,
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
    requestedRange,
    timeframe,
    chartDimensions,
    pixelsPerElement,
    settings,
  }) {
    const isPercent = scaleType === "percent";
    const isNormalized = scaleType === "normalized";

    const timestamps = Utils.getAllTimestampsIn(
      requestedRange.start,
      requestedRange.end,
      timeframe
    );

    const renderingQueueIds = Object.keys(this.sets);
    const data = {};

    let max = -Infinity;
    let min = Infinity;

    // Loop through all indicators to be rendered
    for (const renderingQueueId of renderingQueueIds) {
      const set = this.sets[renderingQueueId];

      data[renderingQueueId] = {};

      for (const time of timestamps) {
        let item = set.data[time];
        if (!item) continue;

        data[renderingQueueId][time] = JSON.parse(
          JSON.stringify(set.data[time])
        );
        item = data[renderingQueueId][time];

        for (let i = 0; i < item.length; i++) {
          const { values } = item[i];

          // If percent, loop through all instructions at and loop through every value for each instruction
          // and compare it to starting value
          if (isPercent) {
            // Get the first set item of the visible range
            const firstInstructions = set.data[timestamps[0]];

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
              Utils.toFixed(((val - set.min) / range) * 100, 4)
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

    const allInstructions = {
      main: {},
      yScale: {},
      xScale: {},
    };

    const visibleRange = { ...requestedRange };

    // If price / y scale is locked, set min and max y values
    if (settings.lockedYScale) {
      const ySpread5P = (max - min) * 0.05;
      visibleRange.min = min - ySpread5P;
      visibleRange.max = max + ySpread5P;
    }

    // Loop through all sets and generate instructions based on them
    for (const renderingQueueId of renderingQueueIds) {
      const { instructions } = this.generateInstructions({
        data: data[renderingQueueId],
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

    const response = this.buildXAndYVisibleScales({
      visibleRange,
      timeframe,
      chartDimensions,
    });

    return {
      allInstructions,
      visibleRange,
      visibleScales: response.visibleScales,
      pixelsPerElement: response.pixelsPerElement,
    };
  }

  generateInstructions({
    data,
    renderingQueueId,
    timestamps,
    scaleType,
    visibleRange,
    timeframe,
    chartDimensions,
    pixelsPerElement,
  }) {
    const vr = visibleRange;

    // TODO re-add min max calcs and bs

    const { main } = chartDimensions;

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
      const item = data[time];

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

  buildXAndYVisibleScales({ visibleRange, chartDimensions, timeframe }) {
    // Calculate pixels per element using range
    const items = (visibleRange.end - visibleRange.start) / timeframe;
    const { width } = chartDimensions.main;
    const ppe = width / items;
    const pixelsPerElement = ppe;

    const visibleScales = { x: [], y: [] };
    let xTimeStep = 0;
    // let yPriceStep = 0;

    const minPixels = 100;

    for (let i = Constants.TIMESCALES.indexOf(timeframe); i >= 0; i--) {
      // Check if this timeframe fits between max and min pixel boundaries
      const pixelsPerScale =
        pixelsPerElement * (Constants.TIMESCALES[i] / timeframe);

      if (pixelsPerScale >= minPixels) {
        xTimeStep = Constants.TIMESCALES[i];
        break;
      }
    }

    // const yRange = range.max - range.min;
    // const exponent = yRange.toExponential().split("e")[1];
    // yPriceStep = Math.pow(10, exponent);

    // Build timestamps that are on interval
    const start = visibleRange.start - (visibleRange.start % xTimeStep);
    for (let i = start; i < visibleRange.end; i += xTimeStep) {
      visibleScales.x.push(i);
    }

    // TODO build y axis range
    // const min = range.min - (range.min % yPriceStep);
    // for (let i = min; i < range.max; i += yPriceStep) {
    //   visibleScales.y.push(i);
    // }

    return { pixelsPerElement, visibleScales };
  }
}

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
