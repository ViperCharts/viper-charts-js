import Utils from "../utils";
import PlotTypes from "../components/plot_types.js";
import ScriptFunctions from "../viper_script/script_functions";
import Instructions from "../models/instructions.js";

import Calculations from "./calculations.js";
import Generators from "./generators.js";

import EventEmitter from "../events/event_emitter";

class ComputedSet {
  constructor({ $state, timeframe, data = {} }) {
    this.$state = $state;

    this.data = data;
    this.timeframe = timeframe;
    this.visibleMin = Infinity;
    this.visibleMax = -Infinity;
    this.visibleScaleMin = Infinity;
    this.visibleScaleMax = -Infinity;
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
  constructor({ chartId }) {
    this.chartId = chartId;

    this.state = {
      maxDecimalPlaces: 0,
    };
  }

  setState(updates) {
    this.state = { ...this.state, ...updates };
    self.postMessage({ type: "setState", chartId, state: this.state });
  }

  updateInstructions(instructions) {
    self.postMessage({
      type: "updateInstructions",
      data: { chartId: this.chartId, instructions },
    });
  }
}

export default class ComputedData extends EventEmitter {
  constructor({ chartId }) {
    super();

    this.chartId = chartId;
    this.mainThread = new MainThreadMessenger({ chartId });
    this.queue = new Map();
    this.sets = {};
    this.computedState = {};

    this.max = -Infinity;
    this.min = Infinity;

    this.maxDecimalPlaces = 0;

    this.offsetX = 0;
    this.offsetY = 0;
  }

  calculateOneSet({ renderingQueueId, timestamps, dataset }) {
    const { timeframe } = dataset;

    const indicator = this.queue.get(renderingQueueId);
    indicator.draw = PlotTypes.getIndicatorById(indicator.id).draw;

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
      // If any of the values are not a number, (invalid calculation, ignore them)
      if (
        values.series.filter((e) => isNaN(e) || typeof e !== "number").length
      ) {
        return;
      }

      // If first plotted item at time, create fresh array
      if (!set.data[time]) {
        set.data[time] = [];
      }

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
      let data = point[indicator.model.id];

      if (
        point[indicator.model.id] === undefined ||
        point[indicator.model.id] === null
      ) {
        continue;
      }

      if (
        indicator.dependencies[0] === "value" &&
        indicator.model.model === "ohlc"
      ) {
        data = { value: point[indicator.model.id].close };
      }

      indicator.draw({
        ...data,
        ...funcWraps,
        times: {
          iteratedTime,
          timeframe,
        },
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

  setVisibility({ renderingQueueId, visible }) {
    if (!this.queue.has(renderingQueueId)) {
      console.error(`${renderingQueueId} was not found in rendering queue`);
      return;
    }

    const indicator = this.queue.get(renderingQueueId);
    indicator.visible = visible;
    this.queue.set(renderingQueueId, indicator);

    // Re calculate max decimal places when sets have changed
    this.calculateMaxDecimalPlaces();

    // If hiding indicator, delete main and yScale plot instructions
    if (!indicator.visible) {
      delete this.instructions.main.values[renderingQueueId];
      delete this.instructions.main.plots[renderingQueueId];
      delete this.instructions.yScale.plots[renderingQueueId];
      this.mainThread.updateInstructions(this.instructions);
    }
  }

  emptySet({ renderingQueueId }) {
    // Delete set info
    delete this.sets[renderingQueueId];
    delete this.computedState[renderingQueueId];

    // Re calculate max decimal places when sets have changed
    this.calculateMaxDecimalPlaces();

    // Delete instructions
    delete this.instructions.main.values[renderingQueueId];
    delete this.instructions.main.plots[renderingQueueId];
    delete this.instructions.yScale.plots[renderingQueueId];
    this.mainThread.updateInstructions(this.instructions);
  }

  emptyAllSets() {
    for (const renderingQueueId in this.sets) {
      this.emptySet({ renderingQueueId });
    }
  }

  /**
   * Remove all data relating to this set/renderingQueueId
   * @param {object} params
   * @param {string} params.renderingQueueId The id in the sets object
   * @returns
   */
  removeFromQueue({ renderingQueueId }) {
    if (!this.queue.has(renderingQueueId)) {
      console.error(`${renderingQueueId} was not found in rendering queue`);
      return false;
    }

    this.queue.delete(renderingQueueId);
    this.emptySet({ renderingQueueId });

    delete this.instructions.main.values[renderingQueueId];
    delete this.instructions.yScale.plots[renderingQueueId];
  }

  generateAllInstructions({
    scaleType,
    requestedRanges,
    timeframe,
    chartDimensions,
    pixelsPerElement,
    settings,
  }) {
    // Calculate max and min of all plotted sets
    const timestamps = Utils.getAllTimestampsIn(
      requestedRanges.x.start,
      requestedRanges.x.end,
      timeframe
    );

    const layerMinsAndMaxs = {};
    for (const layerId in requestedRanges.y) {
      layerMinsAndMaxs[layerId] = {
        min: Infinity,
        max: -Infinity,
      };
    }

    // Calculate min and max of all sets in visible range that are visible
    for (const id in this.sets) {
      // Check if indicator is visible
      const indicator = this.queue.get(id);

      if (!indicator.visible) continue;

      let [setMin, setMax] = Calculations.getMinAndMax(
        this.sets[id],
        timestamps
      );

      let scaleMin = setMin;
      let scaleMax = setMax;

      this.sets[id].visibleMin = setMin;
      this.sets[id].visibleMax = setMax;

      // If percentage chart, calculate scale based on first plotted value
      if (settings.scaleType === "percent") {
        const first = Calculations.getFirstValue(this.sets[id], timestamps);
        scaleMin = ((setMin - first) / first) * 100;
        scaleMax = ((setMax - first) / first) * 100;
      }

      // If normalizes chart, calcualte based on 0-100 range
      if (settings.scaleType === "normalized") {
        scaleMin = 0;
        scaleMax = 100;
      }

      this.sets[id].visibleScaleMin = scaleMin;
      this.sets[id].visibleScaleMax = scaleMax;

      if (!layerMinsAndMaxs[indicator.layerId]) {
        layerMinsAndMaxs[indicator.layerId] = {
          min: Infinity,
          max: -Infinity,
        };
      }

      if (scaleMin < layerMinsAndMaxs[indicator.layerId].min) {
        layerMinsAndMaxs[indicator.layerId].min = scaleMin;
      }
      if (scaleMax > layerMinsAndMaxs[indicator.layerId].max) {
        layerMinsAndMaxs[indicator.layerId].max = scaleMax;
      }
    }

    const visibleRanges = {
      x: {
        start: requestedRanges.x.start,
        end: requestedRanges.x.end,
      },
      y: {},
    };

    // Calculate the visible range based on chart settings.
    for (const layerId in layerMinsAndMaxs) {
      const { y } = Calculations.getVisibleRange.bind(this)(
        {
          x: requestedRanges.x,
          y: requestedRanges.y[layerId],
        },
        layerMinsAndMaxs[layerId].min,
        layerMinsAndMaxs[layerId].max
      );
      visibleRanges.y[layerId] = {
        min: y.range.min,
        max: y.range.max,
      };
    }

    const { start, end } = visibleRanges.x;

    pixelsPerElement = Calculations.calculatePixelsPerElement(
      start,
      end,
      timeframe,
      chartDimensions.main.width
    );

    // Build fresh instructions struct
    const instructions = Instructions;

    // Get array of x coords for each timestamp on x axis
    const timestampXCoords = timestamps.map((time) =>
      Utils.getXCoordByTimestamp(start, end, chartDimensions.main.width, time)
    );

    // Loop through all sets and generate main and yScale instructions for plots
    for (const id in this.sets) {
      const set = this.sets[id];
      const indicator = this.queue.get(id);

      // If indicator is not visible, dont generate instrutions
      if (!indicator.visible) continue;

      // Generate main instructions for set depending on scale type
      const mainLayerGenerate = Generators.main.values[scaleType];
      instructions.main.values[id] = {
        layerId: indicator.layerId,
        values: mainLayerGenerate(
          set,
          timestamps,
          indicator,
          timestampXCoords,
          pixelsPerElement,
          visibleRanges.y[indicator.layerId],
          chartDimensions
        ),
      };

      const yScaleLayerGenerate = Generators.yScale.plots[scaleType];
      const [yScale, main] = yScaleLayerGenerate(
        set,
        timestamps,
        indicator,
        chartDimensions,
        visibleRanges.y[indicator.layerId]
      );

      instructions.yScale.plots[id] = {
        layerId: indicator.layerId,
        values: yScale,
      };
      instructions.main.plots[id] = {
        layerId: indicator.layerId,
        values: main,
      };
    }

    // Calculate x and y scales
    instructions.yScale.scales = Generators.yScale.scales();
    instructions.xScale.scales = Generators.xScale.scales(
      pixelsPerElement,
      timeframe,
      visibleRanges.x
    );

    this.instructions = instructions;

    // TODO this is a temporary implementation
    let maxDecimalPlaces = this.maxDecimalPlaces;
    if (settings.scaleType !== "default") {
      maxDecimalPlaces = 2;
    }

    return {
      instructions,
      visibleRanges,
      pixelsPerElement,
      maxDecimalPlaces,
    };
  }

  calculateMaxDecimalPlaces() {
    let maxDecimalPlaces = 0;
    for (const id in this.sets) {
      const indicator = this.queue.get(id);
      if (!indicator.visible) continue;

      const { decimalPlaces } = this.sets[id];
      if (decimalPlaces > maxDecimalPlaces) {
        maxDecimalPlaces = decimalPlaces;
      }
    }
    this.maxDecimalPlaces = maxDecimalPlaces;
  }
}
