export default {
  plot(
    { renderingQueueId, chart, time, timeframe },
    { value, title, color = "#FFF", linewidth, ylabel = false }
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "line", timeframe, {
      series: [value],
      title,
      colors: { color },
      linewidth,
      ylabel,
    });
  },

  plotBox(
    { renderingQueueId, chart, time, timeframe },
    { top, bottom, width, title, color = "#FFF" }
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "box", timeframe, {
      series: [top, bottom, width],
      title,
      colors: { color },
      ylabel,
    });
  },

  plotCandle(
    { renderingQueueId, chart, time, timeframe },
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
    chart.computedData.addSetItem(renderingQueueId, time, "candle", timeframe, {
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

  setVar({ renderingQueueId, chart, time, computedState }, { name, value }) {
    if (!state[renderingQueueId]) state[renderingQueueId] = {};
    if (!state[renderingQueueId][time]) state[renderingQueueId][time] = {};
    state[renderingQueueId][time][name] = value;
  },

  getVar({ renderingQueueId, chart, time, timeframe }, { name, lookback }) {
    const timestamp = time - lookback * timeframe;
    const { computedState: state } = chart.computedData;

    if (!state[renderingQueueId]) return undefined;
    const item = state[renderingQueueId][timestamp];
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
