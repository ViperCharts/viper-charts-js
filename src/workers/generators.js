import Constants from "../constants";
import Utils from "../utils.js";
import Calculations from "./calculations.js";

export default {
  main: {
    layers: {
      default(
        set,
        timestamps,
        timestampXCoords,
        pixelsPerElement,
        visibleRange,
        chartDimensions
      ) {
        const instructions = {};

        // Get min and max yCoords for multiplication later
        const minY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          chartDimensions.main.height,
          set.visibleMin
        );
        const maxY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          chartDimensions.main.height,
          set.visibleMax
        );
        const rangeY = maxY - minY;
        const range = set.visibleMax - set.visibleMin;

        const { data } = set;

        const getY = (val) =>
          Math.floor(((val - set.visibleMin) / range) * rangeY + minY);

        // Loop through all set times and generate plot values
        for (let i = 0; i < timestamps.length; i++) {
          const time = timestamps[i];
          const x = timestampXCoords[i];

          // Loop through each plot item at time
          const points = data[time];

          // If no points at time, dont generate instructions
          if (!points) continue;

          instructions[time] = [];

          for (const point of points) {
            const { type, values } = point;
            const { series } = values;

            if (type === "line") {
              instructions[time].push({
                type: "line",
                x,
                y: getY(series[0]),
                color: values.colors.color,
                linewidth: values.linewidth,
              });
            } else if (type === "box") {
              const y1 = getY(series[0]);
              const y2 = getY(series[1]);
              const w = pixelsPerElement * series[3];

              instructions[time].push({
                type: "box",
                x: x - w / 2,
                y: y1,
                w,
                h: y2 - y1,
                color: values.colors.color,
              });
            } else if (type === "candle") {
              const y1 = getY(series[0]);
              const y2 = getY(series[1]);
              const y3 = getY(series[2]);
              const y4 = getY(series[3]);
              const w = pixelsPerElement * 0.9;

              instructions[time].push({
                type: "box",
                x: x - w / 2,
                y: y1,
                w,
                h: y4 - y1,
                color: values.colors.color,
              });
              instructions[time].push({
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

        return instructions;
      },

      percent(
        set,
        timestamps,
        timestampXCoords,
        pixelsPerElement,
        visibleRange,
        chartDimensions
      ) {
        const instructions = {};

        // Get min and max yCoords for multiplication later
        const minY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          chartDimensions.main.height,
          set.visibleScaleMin
        );
        const maxY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          chartDimensions.main.height,
          set.visibleScaleMax
        );

        const rangeY = maxY - minY;
        const range = set.visibleMax - set.visibleMin;

        const { data } = set;

        const getY = (val) =>
          Math.floor(((val - set.visibleMin) / range) * rangeY + minY);

        // Loop through all set times and generate plot values
        for (let i = 0; i < timestamps.length; i++) {
          const time = timestamps[i];
          const x = timestampXCoords[i];

          // Loop through each plot item at time
          const points = data[time];

          // If no points at time, dont generate instructions
          if (!points) continue;

          instructions[time] = [];

          for (const point of points) {
            const { type, values } = point;
            const { series } = values;

            if (type === "line") {
              instructions[time].push({
                type: "line",
                x,
                y: getY(series[0]),
                color: values.colors.color,
                linewidth: values.linewidth,
              });
            } else if (type === "box") {
              const y1 = getY(series[0]);
              const y2 = getY(series[1]);
              const w = pixelsPerElement * series[3];

              instructions[time].push({
                type: "box",
                x: x - w / 2,
                y: y1,
                w,
                h: y2 - y1,
                color: values.colors.color,
              });
            } else if (type === "candle") {
              const y1 = getY(series[0]);
              const y2 = getY(series[1]);
              const y3 = getY(series[2]);
              const y4 = getY(series[3]);
              const w = pixelsPerElement * 0.9;

              instructions[time].push({
                type: "box",
                x: x - w / 2,
                y: y1,
                w,
                h: y4 - y1,
                color: values.colors.color,
              });
              instructions[time].push({
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

        return instructions;
      },

      normalized(
        set,
        timestamps,
        timestampXCoords,
        pixelsPerElement,
        visibleRange,
        chartDimensions
      ) {
        const instructions = {};

        // Get min and max yCoords for multiplication later
        const minY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          chartDimensions.main.height,
          set.visibleScaleMin
        );
        const maxY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          chartDimensions.main.height,
          set.visibleScaleMax
        );
        const rangeY = maxY - minY;
        const range = set.visibleMax - set.visibleMin;

        const { data } = set;

        const getY = (val) =>
          Math.floor(((val - set.visibleMin) / range) * rangeY + minY);

        // Loop through all set times and generate plot values
        for (let i = 0; i < timestamps.length; i++) {
          const time = timestamps[i];
          const x = timestampXCoords[i];

          // Loop through each plot item at time
          const points = data[time];

          // If no points at time, dont generate instructions
          if (!points) continue;

          instructions[time] = [];

          for (const point of points) {
            const { type, values } = point;
            const { series } = values;

            if (type === "line") {
              instructions[time].push({
                type: "line",
                x,
                y: getY(series[0]),
                color: values.colors.color,
                linewidth: values.linewidth,
              });
            } else if (type === "box") {
              const y1 = getY(series[0]);
              const y2 = getY(series[1]);
              const w = pixelsPerElement * series[3];

              instructions[time].push({
                type: "box",
                x: x - w / 2,
                y: y1,
                w,
                h: y2 - y1,
                color: values.colors.color,
              });
            } else if (type === "candle") {
              const y1 = getY(series[0]);
              const y2 = getY(series[1]);
              const y3 = getY(series[2]);
              const y4 = getY(series[3]);
              const w = pixelsPerElement * 0.9;

              instructions[time].push({
                type: "box",
                x: x - w / 2,
                y: y1,
                w,
                h: y4 - y1,
                color: values.colors.color,
              });
              instructions[time].push({
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

        return instructions;
      },
    },
  },

  yScale: {
    plots: {
      default(set, timestamps, chartDimensions, visibleRange) {
        const instructions = [];

        // Find last plotted item and create instructions for placement
        for (let i = timestamps.length - 1; i >= 0; i--) {
          const time = timestamps[i];

          const points = set.data[time];

          if (!points) continue;

          for (const point of points) {
            const { type, values } = point;

            // Check if plot point ylabel is set to true
            if (!values.ylabel) continue;

            // Get the appropriate series array plot index depending on plot type
            const value = values.series[{ line: 0, candle: 3 }[type]];

            // Get the appropriate series array plot index depending on plot type
            const y = Utils.getYCoordByPrice(
              visibleRange.min,
              visibleRange.max,
              chartDimensions.yScale.height,
              value
            );

            const textColor = Utils.isColorLight(values.colors.color)
              ? "#000"
              : "#FFF";

            instructions.push({
              type: "box",
              x: 0,
              y: y - 13,
              w: chartDimensions.yScale.width,
              h: 20,
              color: values.colors.color,
            });
            instructions.push({
              type: "text",
              x: chartDimensions.yScale.width / 2,
              y,
              color: textColor,
              text: `${value}`,
              font: "bold 10px Arial",
            });
          }

          // Break after already built instructions for set
          break;
        }

        return instructions;
      },

      percent(set, timestamps, chartDimensions, visibleRange) {
        const instructions = [];

        // Find last plotted item and create instructions for placement
        for (let i = timestamps.length - 1; i >= 0; i--) {
          const time = timestamps[i];

          const points = set.data[time];

          if (!points) continue;

          for (const point of points) {
            const { type, values } = point;

            // Check if plot point ylabel is set to true
            if (!values.ylabel) continue;

            // Get first value
            const first = Calculations.getFirstValue(set, timestamps);
            let value = values.series[{ line: 0, candle: 3 }[type]];
            value = ((value - first) / first) * 100;

            // Get the appropriate series array plot index depending on plot type
            const y = Utils.getYCoordByPrice(
              visibleRange.min,
              visibleRange.max,
              chartDimensions.yScale.height,
              value
            );

            const textColor = Utils.isColorLight(values.colors.color)
              ? "#000"
              : "#FFF";

            const a = value >= 0 ? "+" : "";

            instructions.push({
              type: "box",
              x: 0,
              y: y - 13,
              w: chartDimensions.yScale.width,
              h: 20,
              color: values.colors.color,
            });
            instructions.push({
              type: "text",
              x: chartDimensions.yScale.width / 2,
              y,
              color: textColor,
              text: `${a}${Utils.toFixed(value, 2)}%`,
              font: "bold 10px Arial",
            });
          }

          // Break after already built instructions for set
          break;
        }

        return instructions;
      },

      normalized(set, timestamps, chartDimensions, visibleRange) {
        const instructions = [];

        // Find last plotted item and create instructions for placement
        for (let i = timestamps.length - 1; i >= 0; i--) {
          const time = timestamps[i];

          const points = set.data[time];

          if (!points) continue;

          for (const point of points) {
            const { type, values } = point;

            // Check if plot point ylabel is set to true
            if (!values.ylabel) continue;

            // Get the appropriate series array plot index depending on plot type
            let value = values.series[{ line: 0, candle: 3 }[type]];
            value = Utils.toFixed(
              ((value - set.visibleMin) / (set.visibleMax - set.visibleMin)) *
                100,
              2
            );

            console.log(value);

            // Get the appropriate series array plot index depending on plot type
            const y = Utils.getYCoordByPrice(
              visibleRange.min,
              visibleRange.max,
              chartDimensions.yScale.height,
              value
            );

            const textColor = Utils.isColorLight(values.colors.color)
              ? "#000"
              : "#FFF";

            instructions.push({
              type: "box",
              x: 0,
              y: y - 13,
              w: chartDimensions.yScale.width,
              h: 20,
              color: values.colors.color,
            });
            instructions.push({
              type: "text",
              x: chartDimensions.yScale.width / 2,
              y,
              color: textColor,
              text: `${value}`,
              font: "bold 10px Arial",
            });
          }

          // Break after already built instructions for set
          break;
        }

        return instructions;
      },
    },

    scales() {
      return [];
    },
  },

  xScale: {
    scales(pixelsPerElement, timeframe, visibleRange) {
      const scales = [];

      const minPixels = 100;
      let xTimeStep = 0;

      for (let i = Constants.TIMESCALES.indexOf(timeframe); i >= 0; i--) {
        // Check if this timeframe fits between max and min pixel boundaries
        const pixelsPerScale =
          pixelsPerElement * (Constants.TIMESCALES[i] / timeframe);

        if (pixelsPerScale >= minPixels) {
          xTimeStep = Constants.TIMESCALES[i];
          break;
        }
      }

      const start = visibleRange.start - (visibleRange.start % xTimeStep);
      for (let i = start; i < visibleRange.end; i += xTimeStep) {
        scales.push(i);
      }

      return scales;
    },
  },
};
