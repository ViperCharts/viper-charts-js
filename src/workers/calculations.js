export default {
  /**
   * Loop through all points of a set and get the min and max values
   * @param {string} id
   * @param {number[]} timestamps
   * @returns {number[]} Min and max
   */
  getMinAndMax(id, timestamps) {
    const values = [];

    // Get the set
    const set = this.sets[id];
    if (!set) return values;

    // Add all values to array
    for (const time of timestamps) {
      const points = set.data[time];

      // If no points at time
      if (!points) continue;

      // Add all plot points from each series
      for (const point of points) {
        values.push(...point.values.series);
      }
    }

    return [Math.min(...values), Math.max(...values)];
  },

  getVisibleRange(requestedRange, settings) {
    // If scale is locked, set min and max to min and max of all sets (visible range)
    if (settings.lockedYScale) {
      const ySpread5P = (this.max - this.min) * 0.05;
      requestedRange.min = this.min - ySpread5P;
      requestedRange.max = this.max + ySpread5P;
    }

    return requestedRange;
  },

  calculatePixelsPerElement() {
    const items =
      (this.visibleRange.end - this.visibleRange.start) / this.timeframe;
    return this.chartDimensions.main.width / items;
  },
};
