export default {
  plot(
    { renderingQueueId, chart, time, dataset },
    { value, title, color = "#FFF", linewidth, ylabel = false }
  ) {
    chart.computedData.addSetItem(
      renderingQueueId,
      time,
      "line",
      dataset.timeframe,
      {
        series: [value],
        title,
        colors: { color },
        linewidth,
        ylabel,
      }
    );
  },

  plotBox(
    { renderingQueueId, chart, time, dataset },
    { top, bottom, width, title, color = "#FFF" }
  ) {
    chart.computedData.addSetItem(
      renderingQueueId,
      time,
      "box",
      dataset.timeframe,
      {
        series: [top, bottom, width],
        title,
        colors: { color },
        ylabel,
      }
    );
  },

  plotCandle(
    { renderingQueueId, chart, time, dataset },
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
    chart.computedData.addSetItem(
      renderingQueueId,
      time,
      "candle",
      dataset.timeframe,
      {
        series: [open, high, low, close],
        title,
        colors: {
          color,
          wickcolor,
        },
        ylabel,
      }
    );
  },

  plotText() {},

  // Get value from previous or future data point if exists
  getData({ dataset, time }, { lookback, source }) {
    const { data, timeframe } = dataset;
    const timestamp = time - lookback * timeframe;
    const item = data[timestamp];
    if (!item) return undefined;
    return item[source];
  },

  setVar({ renderingQueueId, chart, time }, { name, value }) {
    const { computedState: state } = chart.computedData;
    if (!state[renderingQueueId]) state[renderingQueueId] = {};
    if (!state[renderingQueueId][time]) state[renderingQueueId][time] = {};
    state[renderingQueueId][time][name] = value;
  },

  getVar({ renderingQueueId, chart, time, dataset }, { name, lookback }) {
    const { timeframe } = dataset;
    const timestamp = time - lookback * timeframe;
    const { computedState: state } = chart.computedData;

    if (!state[renderingQueueId]) return undefined;
    const item = state[renderingQueueId][timestamp];
    if (!item) return undefined;
    return item[name];
  },

  sma({ dataset, time }, { source, length }) {
    let total = 0;
    for (let i = 0; i < length; i++) {
      total += this.getData({ dataset, time }, { lookback: i, source });
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
