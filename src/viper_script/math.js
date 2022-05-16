import Decimal from "decimal.js";

const validateArgs = (args, cb) => {
  for (const arg of args) {
    let items = [arg];

    if (Array.isArray(arg)) {
      items = arg;
    }

    if (!items.length) return NaN;
    for (const item of items) {
      if (item === undefined || isNaN(item) || typeof item !== "number") {
        return NaN;
      }
    }
  }
  return cb(...args);
};

const math = {
  add(a, b) {
    return new Decimal(a).add(b).toNumber();
  },

  subtract(a, b) {
    return new Decimal(a).sub(b).toNumber();
  },

  sub(a, b) {
    return math.subtract(a, b);
  },

  times(a, b) {
    return new Decimal(a).times(b).toNumber();
  },

  divide(a, b) {
    return new Decimal(a).dividedBy(b).toNumber();
  },

  mean(arr) {
    let total = new Decimal(arr[0]);
    for (var i = 1; i < arr.length; i++) {
      total = total.add(arr[i]);
    }
    return total.dividedBy(i).toNumber();
  },

  variance(arr, mean) {
    let sum = new Decimal(0);
    for (var i = 0; i < arr.length; i++) {
      sum = sum.add(new Decimal(arr[i]).minus(mean).pow(2));
    }
    return sum.dividedBy(i - 1).toNumber();
  },

  stdev(arr, mean) {
    return Math.sqrt(math.variance(arr, mean));
  },
};

const exports = {};
for (const key in math) {
  exports[key] = function () {
    return validateArgs(arguments, math[key]);
  };
}

export default exports;
