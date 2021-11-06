export default {
  uniqueId() {
    return Math.random().toString(36).substr(2, 13);
  },

  getAbsoluteMax(value, max) {
    if (value < 0) return Math.min(value, -max);
    return Math.max(value, max);
  },

  randomHexColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  },

  getAllTimestampsIn(start, end, timeframe) {
    start -= start % timeframe;
    end += timeframe - (end % timeframe);
    return new Array((end - start) / timeframe)
      .fill()
      .map((_, i) => start + timeframe * i);
  },
};
