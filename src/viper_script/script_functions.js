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

  plotBox({ addSetItem, time }, { top, bottom, width, title, color = "#FFF" }) {
    addSetItem(time, "box", {
      series: [top, bottom, width],
      title,
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
  getData({ timeframe, data, time }, { lookback, source }) {
    const timestamp = time - lookback * timeframe;
    const item = data[timestamp];
    if (!item) return undefined;
    return item[source];
  },

  setVar({ time, computedState }, { name, value }) {
    if (!computedState[time]) computedState[time] = {};
    computedState[time][name] = value;
  },

  getVar({ time, timeframe, computedState }, { name, lookback }) {
    const timestamp = time - lookback * timeframe;

    const item = computedState[timestamp];
    if (!item) return undefined;
    return item[name];
  },

  sma({ timeframe, data, time }, { source, length }) {
    let total = 0;
    for (let i = 0; i < length; i++) {
      total += this.getData({ timeframe, data, time }, { lookback: i, source });
    }
    return total / length;
  },

  declareGlobal({ globals }, { name, value }) {
    if (!globals[name]) globals[name] = value;
    return globals[name];
  },

  setGlobal({ globals }, { name, value }) {
    globals[name] = value;
    return value;
  },
};
