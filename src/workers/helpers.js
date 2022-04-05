export default {
  yScale: {
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
