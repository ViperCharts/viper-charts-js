import Constants from "../constants.js";

class ChartState {
  constructor() {
    this.data = [];
    this.chartParentElement = null;
    this.timeframe = Constants.MINUTE;
    this.pixelsPerElement = 50;
    this.range = [];
    this.visibleData = [];
    this.visibleScales = {
      x: [],
      y: [],
    };
  }

  setVisibleRange({ start, end }) {
    const visibleData = [];

    const leftOffset = start % this.timeframe;
    const rightOffset = end % this.timeframe;

    // Start loop from right to find end candle
    for (let i = this.data.length - 1; i > -1; i--) {
      const candle = this.data[i];
      const timestamp = candle.time;

      // If right timestamp is not less than right view boundary
      // *We minus the timeframe to the timstamp so we can get data for candles that may be mostly
      // cut off screen
      if (timestamp - this.timeframe > end - rightOffset) continue;

      visibleData.unshift(candle);

      // If last requried timestamp is reached
      if (timestamp === start - leftOffset) {
        break;
      }
    }

    this.visibleData = visibleData;

    // Calculate y axis by using candle low and highs
    let max = 0;
    let min = Infinity;
    for (const candle of this.visibleData) {
      if (candle.low < min) min = candle.low;
      if (candle.high > max) max = candle.high;
    }

    const ySpread5P = (max - min) * 0.05;
    this.range = [start, end, min - ySpread5P, max + ySpread5P];

    this.buildXAndYVisibleScales();
  }

  buildXAndYVisibleScales() {
    const visibleScales = { x: [], y: [] };
    let xTimestampInterval = 0;
    let yTimestampInterval = 0;

    const minPixels = 100;

    for (let i = Constants.TIMESCALES.indexOf(this.timeframe); i >= 0; i--) {
      // Check if this timeframe fits between max and min pixel boundaries
      const pixelsPerScale =
        this.pixelsPerElement * (Constants.TIMESCALES[i] / this.timeframe);

      if (pixelsPerScale >= minPixels) {
        xTimestampInterval = Constants.TIMESCALES[i];
        break;
      }
    }

    // Build timestamps that are on interval
    const start = this.range[0] - (this.range[0] % xTimestampInterval);
    for (let i = start; i < this.range[1]; i += xTimestampInterval) {
      visibleScales.x.push(i);
    }

    this.visibleScales = visibleScales;
  }

  setInitialVisibleRange(height, width) {
    // End timestamp based on last element
    const end = this.data[this.data.length - 1].time + this.timeframe;

    // Calculate start timestamp using width and pixelsPerElement
    const candlesInView = width / this.pixelsPerElement;
    // Set start to candlesInView lookback
    const start = end - candlesInView * this.timeframe;

    this.setVisibleRange({ start, end });
  }

  /**
   * Take x and y movements from canvas mouse listeners to update chart visible ranges
   * @param {number} movementX + or - mouse movement
   * @param {number} movementY + or - mouse movement
   */
  handleMouseRangeChange(movementX, movementY) {
    let [start, end, min, max] = this.range;

    const xDiff = end - start;
    const yDiff = max - min;

    const xChange = Math.floor(xDiff / 2000) * movementX;
    start -= xChange;
    end -= xChange;

    this.setVisibleRange({ start, end });
  }

  resizeXRange(delta, width) {
    const ppe = this.pixelsPerElement;

    if (delta < 0) {
      this.pixelsPerElement = Math.max(1, ppe - ppe / 5);
    } else if (delta > 0) {
      this.pixelsPerElement = Math.min(ppe + ppe / 5, 1000);
    }

    // End timestamp based on last element
    const end = this.range[1];

    // Calculate start timestamp using width and pixelsPerElement
    const candlesInView = width / this.pixelsPerElement;
    // Set start to candlesInView lookback
    const start = end - candlesInView * this.timeframe;

    this.setVisibleRange({ start, end });
  }
}

export default new ChartState();
