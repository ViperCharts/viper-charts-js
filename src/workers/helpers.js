import Calculations from "./calculations.js";
import Utils from "../utils.js";

export default {
  yScale: {
    plots: {
      plotValue(set, type, series, timestamps, scaleType) {
        let value = series[{ line: 0, candle: 3 }[type]];

        if (scaleType === "percent") {
          const first = Calculations.getFirstValue(set, timestamps);
          value = (((value - first) / Math.abs(first)) * 100).toFixed(2);
        } else if (scaleType === "normalized") {
          value = Utils.toFixed(
            ((value - set.visibleMin) / (set.visibleMax - set.visibleMin)) *
              100,
            2
          );
        }

        return value;
      },

      yScaleText(value, color, scaleType) {
        let text = `${value}`;

        if (scaleType === "percent") {
          const a = value >= 0 ? "+" : "";
          text = `${a}${value}%`;
        }

        return { text, color: Utils.isColorLight(color) ? "#000" : "#FFF" };
      },
    },

    scales: {
      scaleText(value, scaleType) {
        if (scaleType === "percent") {
          const a = value >= 0 ? "+" : "";
          return `${a}${value}%`;
        }
        return `${value}`;
      },
    },
  },
};
