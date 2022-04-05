import Constants from "../constants";
import Utils from "../utils.js";
import Calculations from "./calculations.js";
import Helpers from "./helpers.js";

import Decimal from "decimal.js";

export default {
  main: {
    values: {
      default(
        set,
        timestamps,
        indicator,
        timestampXCoords,
        pixelsPerElement,
        visibleRange,
        chartDimensions
      ) {
        const instructions = {};
        const { top, height } = chartDimensions.main.layers[indicator.layerId];

        // Get min and max yCoords for multiplication later
        const minY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          height,
          set.visibleMin
        );
        const maxY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          height,
          set.visibleMax
        );
        const rangeY = maxY - minY;
        const range = set.visibleMax - set.visibleMin;

        const { data } = set;

        const getY = (val) =>
          top +
          Math.max(
            0,
            Math.min(
              Math.floor(((val - set.visibleMin) / range) * rangeY + minY),
              height
            )
          );

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
              // If center is true, add offset to time
              const offset = values.center ? pixelsPerElement / 2 : 0;
              const y1 = getY(series[0]);
              const y2 = getY(series[1]);
              const w = pixelsPerElement * values.width;

              instructions[time].push({
                type: "box",
                x: x - offset,
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
        indicator,
        timestampXCoords,
        pixelsPerElement,
        visibleRange,
        chartDimensions
      ) {
        const instructions = {};
        const { top, height } = chartDimensions.main.layers[indicator.layerId];

        // Get min and max yCoords for multiplication later
        const minY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          height,
          set.visibleScaleMin
        );
        const maxY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          height,
          set.visibleScaleMax
        );

        const rangeY = maxY - minY;
        const range = set.visibleMax - set.visibleMin;

        const { data } = set;

        const getY = (val) =>
          top +
          Math.max(
            0,
            Math.min(
              Math.floor(((val - set.visibleMin) / range) * rangeY + minY),
              height
            )
          );

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
        indicator,
        timestampXCoords,
        pixelsPerElement,
        visibleRange,
        chartDimensions
      ) {
        const instructions = {};
        const { top, height } = chartDimensions.main.layers[indicator.layerId];

        // Get min and max yCoords for multiplication later
        const minY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          height,
          set.visibleScaleMin
        );
        const maxY = Utils.getYCoordByPrice(
          visibleRange.min,
          visibleRange.max,
          height,
          set.visibleScaleMax
        );
        const rangeY = maxY - minY;
        const range = set.visibleMax - set.visibleMin;

        const { data } = set;

        const getY = (val) =>
          top +
          Math.max(
            0,
            Math.min(
              Math.floor(((val - set.visibleMin) / range) * rangeY + minY),
              height
            )
          );

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
      default(set, timestamps, indicator, chartDimensions, visibleRange) {
        const yScaleInstructions = [];
        const mainInstructions = [];

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

            const { top, height } =
              chartDimensions.main.layers[indicator.layerId];

            // Get the appropriate series array plot index depending on plot type
            let y = Math.max(
              0,
              Math.min(
                Utils.getYCoordByPrice(
                  visibleRange.min,
                  visibleRange.max,
                  height,
                  value
                ),
                height
              ) - 13
            );

            if (y + 20 > height) {
              y -= y + 20 - height;
            }

            y += top;

            const textColor = Utils.isColorLight(values.colors.color)
              ? "#000"
              : "#FFF";

            yScaleInstructions.push({
              type: "box",
              x: 0,
              y: y,
              w: chartDimensions.yScale.width,
              h: 20,
              color: values.colors.color,
            });
            yScaleInstructions.push({
              type: "text",
              x: chartDimensions.yScale.width / 2,
              y: y + 13,
              color: textColor,
              text: `${value}`,
              font: "bold 10px Arial",
            });

            const text = `${indicator.datasetId}`;
            const textWidth = text.length * 7;

            mainInstructions.push({
              type: "box",
              x: chartDimensions.main.width - textWidth,
              y,
              w: textWidth,
              h: 20,
              color: values.colors.color,
            });
            mainInstructions.push({
              type: "text",
              x: chartDimensions.main.width - textWidth / 2,
              y: y + 13,
              color: textColor,
              text,
              font: "bold 10px Arial",
            });
          }

          // Break after already built instructions for set
          break;
        }

        return [yScaleInstructions, mainInstructions];
      },

      percent(set, timestamps, indicator, chartDimensions, visibleRange) {
        const yScaleInstructions = [];
        const mainInstructions = [];

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

            const { top, height } =
              chartDimensions.main.layers[indicator.layerId];

            // Get the appropriate series array plot index depending on plot type
            let y = Math.max(
              0,
              Math.min(
                Utils.getYCoordByPrice(
                  visibleRange.min,
                  visibleRange.max,
                  height,
                  value
                ),
                height
              ) - 13
            );

            if (y + 20 > height) {
              y -= y + 20 - height;
            }

            y += top;

            const textColor = Utils.isColorLight(values.colors.color)
              ? "#000"
              : "#FFF";

            const a = value >= 0 ? "+" : "";

            yScaleInstructions.push({
              type: "box",
              x: 0,
              y: y,
              w: chartDimensions.yScale.width,
              h: 20,
              color: values.colors.color,
            });
            yScaleInstructions.push({
              type: "text",
              x: chartDimensions.yScale.width / 2,
              y: y + 13,
              color: textColor,
              text: `${a}${Utils.toFixed(value, 2)}%`,
              font: "bold 10px Arial",
            });

            const text = `${indicator.datasetId}`;
            const textWidth = text.length * 7;

            mainInstructions.push({
              type: "box",
              x: chartDimensions.main.width - textWidth,
              y: y,
              w: textWidth,
              h: 20,
              color: values.colors.color,
            });
            mainInstructions.push({
              type: "text",
              x: chartDimensions.main.width - textWidth / 2,
              y: y + 13,
              color: textColor,
              text,
              font: "bold 10px Arial",
            });
          }

          // Break after already built instructions for set
          break;
        }

        return [yScaleInstructions, mainInstructions];
      },

      normalized(set, timestamps, indicator, chartDimensions, visibleRange) {
        const yScaleInstructions = [];
        const mainInstructions = [];

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

            const { top, height } =
              chartDimensions.main.layers[indicator.layerId];

            // Get the appropriate series array plot index depending on plot type
            let y = Math.max(
              0,
              Math.min(
                Utils.getYCoordByPrice(
                  visibleRange.min,
                  visibleRange.max,
                  height,
                  value
                ),
                height
              ) - 13
            );

            if (y + 20 > height) {
              y -= y + 20 - height;
            }

            y += top;

            const textColor = Utils.isColorLight(values.colors.color)
              ? "#000"
              : "#FFF";

            yScaleInstructions.push({
              type: "box",
              x: 0,
              y: y,
              w: chartDimensions.yScale.width,
              h: 20,
              color: values.colors.color,
            });
            yScaleInstructions.push({
              type: "text",
              x: chartDimensions.yScale.width / 2,
              y: y + 13,
              color: textColor,
              text: `${value}`,
              font: "bold 10px Arial",
            });

            const text = `${indicator.datasetId}`;
            const textWidth = text.length * 7;

            mainInstructions.push({
              type: "box",
              x: chartDimensions.main.width - textWidth,
              y: y,
              w: textWidth,
              h: 20,
              color: values.colors.color,
            });
            mainInstructions.push({
              type: "text",
              x: chartDimensions.main.width - textWidth / 2,
              y: y + 13,
              color: textColor,
              text,
              font: "bold 10px Arial",
            });
          }

          // Break after already built instructions for set
          break;
        }

        return [yScaleInstructions, mainInstructions];
      },
    },

    scales(yRanges, chartDimensions, requestedRanges) {
      const scales = {};

      for (const id in yRanges) {
        let { min, max } = yRanges[id];

        if (min === Infinity || max === -Infinity) continue;

        const { top, height } = chartDimensions.main.layers[id];

        const range = new Decimal(max - min);
        const exp = new Decimal(+range.toExponential().split("e")[1]);
        const interval = new Decimal(10).pow(exp);

        const baseInterval = new Decimal(interval);
        let i = 1;
        const arr = [0.5, 0.25, 0.1, 0.05, 0.025, 0.001];
        while ((max - min) / interval < Math.floor(height / 50)) {
          if (!arr[i]) break;
          interval = baseInterval.times(arr[i]);
          i++;
        }

        min = new Decimal(min)
          .minus(new Decimal(min).modulo(interval))
          .toNumber();
        max = new Decimal(max)
          .plus(interval.minus(new Decimal(max).modulo(interval)))
          .toNumber();

        const getY = (v) =>
          Utils.getYCoordByPrice(yRanges[id].min, yRanges[id].max, height, v);

        scales[id] = [];
        const layer = requestedRanges[id];

        for (let i = 0; i < (max - min) / interval; i++) {
          const value = interval.times(i).add(min).toNumber();
          if (value < yRanges[id].min || value > yRanges[id].max) continue;

          scales[id].push({
            x: chartDimensions.yScale.width / 2,
            y: top + getY(value),
            color: "#A7A8B3",
            text: Helpers.yScale.scales.scaleText(value, layer.scaleType),
          });
        }
      }

      return scales;
    },
  },

  xScale: {
    scales(pixelsPerElement, timeframe, visibleRange, chartDimensions) {
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

      const getX = (t) =>
        Utils.getXCoordByTimestamp(
          visibleRange.start,
          visibleRange.end,
          chartDimensions.xScale.width,
          t
        );

      const start = visibleRange.start - (visibleRange.start % xTimeStep);
      for (let time = start; time < visibleRange.end; time += xTimeStep) {
        const d = new Date(time);
        scales.push({
          x: getX(time),
          y: 13,
          color: "#A7A8B3",
          text: `${d.getHours()}:${`0${d.getMinutes()}`.slice(-2)}`,
        });
      }

      return scales;
    },
  },
};
