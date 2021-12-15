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
};
