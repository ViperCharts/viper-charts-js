export default {
  uniqueId() {
    return Math.random().toString(36).substr(2, 13);
  },

  getNegativeAgnosticMax(value, max) {
    if (value < 0) return Math.min(value, -max);
    return Math.max(value, max);
  },

  randomHexColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(16)}`;
  },
};
