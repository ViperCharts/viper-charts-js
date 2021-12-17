import ScriptFunctions from "../viper_script/script_functions";
import indicators from "../components/indicators";

export default {
  calculateOneSet({ indicatorName, visibleData, datasetData, timeframe }) {
    let iteratedTime = 0;

    // Load the indicator file if it exists
    const indicator = indicators.map[indicatorName];

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
            timeframe,
            data: datasetData,
            globals,
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
  },
};
