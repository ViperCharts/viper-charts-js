import Decimal from "decimal.js";

const validateArgs = (args, cb) => {
  for (const arg of args) {
    if (arg === undefined || isNaN(arg) || typeof arg !== "number") {
      return NaN;
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
};

const exports = {};
for (const key in math) {
  exports[key] = function () {
    return validateArgs(arguments, math[key]);
  };
}

export default exports;
