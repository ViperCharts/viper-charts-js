export default {
  uniqueId() {
    return Math.random().toString(36).substr(2, 13);
  },

  /**
   * Get min and max from array
   * (this is used over Math.min and Math.max because they can result in callstack overflow on large arrays)
   * @param {[]number} arr
   * @returns [min, max]
   */
  getMinAndMax(arr) {
    let len = arr.length;
    let max = -Infinity;
    let min = Infinity;

    while (len--) {
      max = arr[len] > max ? arr[len] : max;
      min = arr[len] < min ? arr[len] : min;
    }
    return [min, max];
  },

  getAbsoluteMax(value, max) {
    if (value < 0) return Math.min(value, -max);
    return Math.max(value, max);
  },

  randomHexColor() {
    return `#${Math.floor(Math.random() * 16777215).toString(
      16
    )}00000`.substring(0, 7);
  },

  /**
   * Get all timestamps aligned to timeframe within start and end range
   * @param {number} start Start unix time
   * @param {number} end End unix time
   * @param {number} timeframe Timeframe in ms
   * @returns {number[]} Array of timestamps
   */
  getAllTimestampsIn(start, end, timeframe) {
    start -= start % timeframe;
    end += timeframe - (end % timeframe);
    const intervals = (end - start) / timeframe;
    if (intervals % 1 !== 0 || intervals === 0) {
      return [];
    }
    return new Array(intervals).fill().map((_, i) => start + timeframe * i);
  },

  /**
   * Get a timestamp at x coord for given width and visible range
   * @param {number} start
   * @param {number} end
   * @param {number} width
   * @param {number} xCoord
   */
  getTimestampByXCoord(start, end, width, xCoord) {
    const msInView = end - start;
    const perc = xCoord / width;
    const time = perc * msInView;
    return start + time;
  },

  /**
   * Get an x coord for a given width and visible range
   * @param {number} start
   * @param {number} end
   * @param {number} width
   * @param {number} timestamp
   * @returns
   */
  getXCoordByTimestamp(start, end, width, timestamp) {
    const msInView = end - start;
    const msFromStart = timestamp - start;
    const perc = msFromStart / msInView;
    return Math.floor(perc * width);
  },

  /**
   * Get a y coord for a given height and visible range
   * @param {number} min
   * @param {number} max
   * @param {number} height
   * @param {number} price
   * @returns
   */
  getYCoordByPrice(min, max, height, price) {
    const yInView = max - min;
    const yFromMin = price - min;
    const perc = yFromMin / yInView;
    return -Math.floor(perc * height - height);
  },

  /**
   * Get a price for a given height and visible range
   * @param {number} min
   * @param {number} max
   * @param {number} height
   * @param {number} yCoord
   * @returns
   */
  getPriceByYCoord(min, max, height, yCoord) {
    const range = max - min;
    const screenPerc = 1 - yCoord / height;
    const rangeOffset = screenPerc * range;
    return min + rangeOffset;
  },

  wipeObject(object) {
    for (const key in object) {
      delete object[key];
    }
    return object;
  },

  toFixed(value, decimalPlaces) {
    return +parseFloat(value).toFixed(decimalPlaces);
  },

  getDecimalPlaces(value, max = Infinity) {
    if (isNaN(value)) return 0;
    let text = value.toString();
    // verify if number 0.000005 is represented as "5e-6"
    if (text.indexOf("e-") > -1) {
      let [_, trail] = text.split("e-");
      return Math.min(parseInt(trail, 10), max);
    }
    // count decimals for number in representation like "0.123456"
    if (Math.floor(value) !== value) {
      return Math.min(value.toString().split(".")[1].length || 0, max);
    }
    return 0;
  },

  isColorLight(color) {
    // Variables for red, green, blue values
    let r, g, b, hsp;

    // Check the format of the color, HEX or RGB?
    if (color.match(/^rgb/)) {
      // If RGB --> store the red, green, blue values in separate variables
      color = color.match(
        /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/
      );

      r = color[1];
      g = color[2];
      b = color[3];
    } else {
      // If hex --> Convert it to RGB: http://gist.github.com/983661
      color = +(
        "0x" + color.slice(1).replace(color.length < 5 && /./g, "$&$&")
      );

      r = color >> 16;
      g = (color >> 8) & 255;
      b = color & 255;
    }

    // HSP (Highly Sensitive Poo) equation from http://alienryderflex.com/hsp.html
    hsp = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));

    // Using the HSP value, determine whether the color is light or dark
    return hsp > 127.5;
  },

  aZ: (v, length = 2) => `0000000000000000${v}`.substr(-length),

  DateWrapper: class DateWrapper {
    constructor(value) {
      this.value = new Date(value);
    }

    time() {
      return this.value.getTime();
    }

    ms() {
      return this.value.getMilliseconds();
    }
    s() {
      return this.value.getSeconds();
    }
    m() {
      return this.value.getMinutes();
    }
    h() {
      return this.value.getHours();
    }
    d() {
      return Math.floor(this.value.getTime() / (6e4 * 60 * 24));
    }
  },

  /**
   * Get formatted string based on how many months,days,hours,minutes,seconds,
   * and milliseconds are left in time
   * @param {int} now Milliseconds since epoch
   * @param {int} tf Timeframe interval in ms
   */
  formatTimeLeft(now, tf) {
    const { aZ } = this;

    // Milliseconds left in time
    const ms = tf - (now % tf);
    const d = new this.DateWrapper(ms);

    // If less than 1min left
    if (ms < 6e4) {
      return `${aZ(d.s())}.${aZ(d.ms(), 4)}`;
    }

    // If less than 1 hour left
    if (ms < 6e4 * 60) {
      return `${aZ(d.m())}m:${aZ(d.s())}s`;
    }

    // If less than 1d left
    if (ms < 6e4 * 60 * 24) {
      return `${aZ(d.h())}h:${aZ(d.m())}m`;
    }

    // Else
    return `${aZ(d.d())}d:${aZ(d.h())}h`;
  },
};
