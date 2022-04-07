import Decimal from "decimal.js";
import math from "./math.js";

export default {
  plot(
    { addSetItem, time },
    { value, title, color = "#FFF", linewidth, ylabel = false }
  ) {
    addSetItem(time, "line", {
      series: [value],
      title,
      colors: { color },
      linewidth,
      ylabel,
    });
  },

  fill({ addSetItem, time }, { value1, value2, color = "#FFF" }) {
    addSetItem(time, "fill", {
      series: [value1, value2],
      colors: { color },
    });
  },

  plotBox(
    { addSetItem, time },
    {
      top,
      bottom,
      width,
      center = false,
      title,
      color = "#FFF",
      ylabel = false,
    }
  ) {
    addSetItem(time, "box", {
      series: [top, bottom],
      width,
      title,
      center,
      colors: { color },
      ylabel,
    });
  },

  plotVolume({ addSetItem, time }, { volume, title, color = "#FFF" }) {
    addSetItem(time, "volume", {
      series: [volume],
      title,
      colors: {
        color,
      },
    });
  },

  plotDeltaArea(
    { addSetItem, time },
    {
      value,
      title,
      posColor = "#FFF",
      negColor = "#FFF",
      linewidth,
      ylabel = false,
    }
  ) {
    addSetItem(time, "delta-area", {
      series: [value],
      title,
      linewidth,
      colors: {
        pos: posColor,
        neg: negColor,
      },
      ylabel,
    });
  },

  plotCandle(
    { addSetItem, time },
    {
      open,
      high,
      low,
      close,
      title,
      color = "#FFF",
      wickcolor = "#FFF",
      ylabel = false,
    }
  ) {
    addSetItem(time, "candle", {
      series: [open, high, low, close],
      title,
      colors: {
        color,
        wickcolor,
      },
      ylabel,
    });
  },

  plotText() {},

  // Get value from previous or future data point if exists
  getData({ set, timeframe, data, time, dataModel }, { lookback, source }) {
    set.addLookback(lookback);
    const timestamp = time - lookback * timeframe;
    const item = data[timestamp];
    if (!item) return undefined;
    if (!item[dataModel.id]) return undefined;
    return item[dataModel.id][source];
  },

  getDataArray(
    { set, timeframe, data, time, dataModel },
    { lookback, source }
  ) {
    set.addLookback(lookback);
    const items = [];
    for (let i = lookback; i >= 0; i--) {
      const timestamp = time - i * timeframe;
      const item = data[timestamp];
      if (!item) continue;
      if (!item[dataModel.id]) continue;
      items.push(item[dataModel.id][source]);
    }
    return items;
  },

  setVar({ time, computedState }, { name, value }) {
    if (!computedState[time]) computedState[time] = {};
    computedState[time][name] = value;
  },

  getVar({ set, time, timeframe, computedState }, { name, lookback }) {
    set.addLookback(lookback);
    const timestamp = time - lookback * timeframe;
    const item = computedState[timestamp];
    if (!item) return undefined;
    return item[name];
  },

  sma({ dataModel }, { source, length }) {
    source = dataModel.model === "ohlc" ? "close" : source;

    const points = this.getDataArray(arguments[0], {
      lookback: length,
      source,
    }).filter((v) => !isNaN(v) && typeof v === "number");

    return math.mean(points);
  },

  mean() {
    return this.sma(...arguments);
  },

  bbands({ dataModel }, { source, length, multiplier }) {
    source = dataModel.model === "ohlc" ? "close" : source;

    const points = this.getDataArray(arguments[0], {
      lookback: length,
      source,
    }).filter((v) => !isNaN(v) && typeof v === "number");

    const basis = math.mean(points);
    const dev = math.times(math.stdev(points, basis), multiplier);

    return [basis, math.add(basis, dev), math.sub(basis, dev)];
  },

  // rsi({ dataModel, setVar, getVar }, { source, length }) {
  //   source = dataModel.model === "ohlc" ? "close" : source;

  //   let totalGain = 0;
  //   let totalLoss = 0;
  //   const points = this.getDataArray(arguments[0], {
  //     lookback: length,
  //     source,
  //   }).filter((v) => !isNaN(v) && typeof v === "number");

  //   for (let i = 0; i < points.length; i++) {
  //     const v = points[i] - points[i + 1];

  //     if (point >= 0) totalGain += v;
  //     else totalLoss += v;
  //   }

  //   let avgGain = new Decimal(totalGain).dividedBy(14);
  //   let avgLoss = new Decimal(totalLoss).dividedBy(14);

  //   setVar({ name: "avgGain", value: avgGain });
  //   setVar({ name: "avgLoss", value: avgLoss });

  //   const rsi = new Decimal(100).minus(
  //     new Decimal(100).dividedBy(avgGain.dividedBy(avgLoss).plus(1))
  //   );

  //   const lastRsi = getVar({ name: "rsi", lookback: 1 });

  //   return
  // },

  declareGlobal({ globals }, { name, value }) {
    if (!globals[name]) globals[name] = value;
    return globals[name];
  },

  setGlobal({ globals }, { name, value }) {
    globals[name] = value;
    return value;
  },
};
