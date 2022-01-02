import Utils from "../utils";
import ScriptFunctions from "../viper_script/script_functions";
import indicators from "../components/indicators";

export default {
  calculateOneSet({
    indicatorName,
    range,
    datasetData,
    timeframe,
    computedState,
    color,
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

    const indicator = new indi.class({ color });

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
    for (const timestamp of Utils.getAllTimestampsIn(
      range.start,
      range.end,
      timeframe
    )) {
      iteratedTime = timestamp;
      const point = datasetData[iteratedTime];

      if (point === undefined || point === null) continue;

      indicator.drawFunc.bind(indicator)({
        ...point,
        ...funcWraps,
      });
    }

    return { ok: true, data: { set } };
  },

  generateInstructions({
    scaleType,
    sets,
    visibleRange,
    timeframe,
    chartDimensions,
    pixelsPerElement,
  }) {
    const isPercent = scaleType === "percent";
    const isNormalized = scaleType === "normalized";

    let max = -Infinity;
    let min = Infinity;

    const dataDictionaryCopy = {};
    const vr = visibleRange;

    const times = Utils.getAllTimestampsIn(vr.start, vr.end, timeframe);

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

    const { main, yScale } = chartDimensions;

    const instructions = {};
    const yScaleInstructions = {};
    let maxWidth = 0;

    const getXCoordByTimestamp = (ts) =>
      Utils.getXCoordByTimestamp(vr.start, vr.end, main.width, ts);
    const getYCoordByPrice = (p) =>
      Utils.getYCoordByPrice(vr.min, vr.max, main.height, p);

    // Calculate actual instructions
    for (const id in dataDictionaryCopy) {
      const data = dataDictionaryCopy[id];

      instructions[id] = {};
      const set = sets[id];

      for (const time in data) {
        const item = JSON.parse(JSON.stringify(data[time]));

        instructions[id][time] = [];

        const x = getXCoordByTimestamp(time);

        // Loop through all instructions for this time
        for (let i = 0; i < item.length; i++) {
          const { type, values } = item[i];
          const { series } = values;

          if (type === "line") {
            instructions[id][time].push({
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

            instructions[id][time].push({
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

          const y = getYCoordByPrice(value);
          let textColor = Utils.isColorLight(values.colors.color)
            ? "#000"
            : "#FFF";

          const symbol = isPercent ? (value >= 0 ? "+" : "-") : "";
          const extra = isPercent ? "%" : "";

          const val =
            scaleType === "default"
              ? parseFloat(value).toFixed(set.decimalPlaces)
              : value;

          const text = `${symbol}${val}${extra}`;
          // const { ctx } = this.$chart.subcharts.yScale.canvas;
          // const textWidth = Math.ceil(ctx.measureText(text).width);
          const textWidth = text.length * 3;

          if (textWidth > maxWidth) maxWidth = textWidth;

          const id = Utils.uniqueId();
          yScaleInstructions[id] = {
            type: "text",
            x: yScale.width / 2,
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
            w: yScale.width,
            h: 20,
            color: values.colors.color,
          };

          // this.$chart.subcharts.yScale.canvas.RE.addToRenderingOrder(id, 1);
          // this.$chart.subcharts.yScale.canvas.RE.addToRenderingOrder(id2, 1);
        }
      }
    }

    return {
      ok: true,
      data: {
        min,
        max,
        maxWidth,
        instructions,
        yScaleInstructions,
      },
    };
  },

  generateInstruction({
    scaleType,
    set,
    visibleRange,
    timeframe,
    chartDimensions,
    pixelsPerElement,
  }) {
    const isPercent = scaleType === "percent";
    const isNormalized = scaleType === "normalized";

    let max = -Infinity;
    let min = Infinity;

    const vr = visibleRange;

    const times = Utils.getAllTimestampsIn(vr.start, vr.end, timeframe);

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
  },
};
