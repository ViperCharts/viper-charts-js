export default {
  main: {
    layers: {
      default(set, timestamps, timestampXCoords) {
        const instructions = {};

        // Get min and max yCoords for multiplication later
        const minY = this.getYCoordByPrice(set.visibleMin);
        const maxY = this.getYCoordByPrice(set.visibleMax);
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
              const w = this.pixelsPerElement * series[3];

              instructions[time].push({
                type: "box",
                x: x - w / 2,
                y: y1,
                w,
                h: Math.abs(y2) - Math.abs(y1),
                color: values.colors.color,
              });
            } else if (type === "candle") {
              const y1 = getY(series[0]);
              const y2 = getY(series[1]);
              const y3 = getY(series[2]);
              const y4 = getY(series[3]);
              const w = this.pixelsPerElement * 0.9;

              instructions[time].push({
                type: "box",
                x: x - w / 2,
                y: y1,
                w,
                h: Math.abs(y4) - Math.abs(y1),
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
      default(set, timestamps) {
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
            const value = values.series[{ line: 0, candle: 0 }[type]];
            const y = getYCoordByPrice(value);

            const textColor = Utils.isColorLight(values.colors.color)
              ? "#000"
              : "#FFF";

            instructions.push({
              type: "box",
              x: 0,
              y: y - 13,
              w: this.chartDimensions.yScale.width,
              h: 20,
              color: values.colors.color,
            });
            instructions.push({
              type: "text",
              x: this.chartDimensions.yScale.width / 2,
              y,
              color: textColor,
              text,
              font: "bold 10px Arial",
            });
          }
        }

        return instructions;
      },
    },
  },

  xScale: {},
};
