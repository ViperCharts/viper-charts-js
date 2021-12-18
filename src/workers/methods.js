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
    const indi = indicators.map.get(
      indicatorName.replaceAll(" ", "-").toLowerCase()
    );

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
};
