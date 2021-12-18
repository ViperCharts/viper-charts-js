import Utils from "../utils";
import ScriptFunctions from "../viper_script/script_functions";
import indicators from "../components/indicators";

export default {
  calculateOneSet({
    indicatorName,
    visibleData,
    datasetData,
    timeframe,
    computedState,
  }) {
    let iteratedTime = 0;

    const set = {
      data: {},
      min: Infinity,
      max: -Infinity,
      decimalPlaces: 0,
    };

    const addSetItem = (time, type, values) => {
      if (!set.data[time]) set.data[time] = [];
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
            set.decimalPlaces = decimalPlaces;
          }
        }
      }
    };

    // Load the indicator file if it exists
    const indi = indicators.map.get(indicatorName);

    if (!indi) {
      return {
        ok: false,
        error: `No indicator found by name ${indicatorName}`,
      };
    }

    const indicator = new indi.class({});

    // Storage for global variables used across indicator times only defined once
    const globals = {};

    const funcWraps = {};
    for (const funcName in ScriptFunctions) {
      funcWraps[funcName] = function () {
        return ScriptFunctions[funcName](
          {
            addSetItem,
            time: iteratedTime,
            timeframe,
            data: datasetData,
            globals,
            computedState,
          },
          ...arguments
        );
      }.bind(this);
    }

    // Run the indicator function for this candle and get all results
    for (const point of visibleData.data) {
      iteratedTime = point.time;

      indicator.drawFunc.bind(indicator)({
        ...point,
        ...funcWraps,
      });
    }

    return { ok: true, data: { set } };
  },

  generateInstructions({ scaleType, sets, start, end, timeframe }) {
    const isPercent = scaleType === "percent";
    const isNormalized = scaleType === "normalized";

    let max = -Infinity;
    let min = Infinity;

    const dataDictionaryCopy = {};

    const times = Utils.getAllTimestampsIn(start, end, timeframe);

    for (const id in sets) {
      const set = sets[id];
      dataDictionaryCopy[id] = JSON.parse(JSON.stringify(set.data));
      const data = dataDictionaryCopy[id];

      for (const time of times) {
        const item = data[time];

        if (!item) continue;

        for (let i = 0; i < item.length; i++) {
          const { values } = item[i];

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
  },
};
