export default {
  /**
   * Loop through all points of a set and get the min and max values
   * @param {ComputedSet} set
   * @param {number[]} timestamps
   * @returns {number[]} Min and max
   */
  getMinAndMax(set, timestamps) {
    const values = [];

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

  /**
   * Get the first plotted element, if any in computed set in range of timestamps
   * @param {ComputedSet} set
   * @param {number[]} timestamps
   * @returns {number} First plotted value
   */
  getFirstValue(set, timestamps) {
    for (const time of timestamps) {
      const points = set.data[time];

      // If no points at time
      if (!points || !points.length) continue;

      return points[0].values.series[0];
    }
  },

  getVisibleRange(requestedRange, settings, min, max) {
    // If scale is locked, set min and max to min and max of all sets (visible range)
    if (settings.lockedYScale) {
      const ySpread5P = (max - min) * 0.05;
      requestedRange.min = min - ySpread5P;
      requestedRange.max = max + ySpread5P;
    }

    return requestedRange;
  },

  calculatePixelsPerElement(start, end, timeframe, width) {
    return width / ((end - start) / timeframe);
  },
};
