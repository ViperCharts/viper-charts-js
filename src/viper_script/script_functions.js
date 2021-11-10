import GlobalState from "../state/global.js";

export default {
  plot(
    { renderingQueueId, chart, time },
    { value, title, color = "#FFF", linewidth, ylabel = false }
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "line", {
      series: [value],
      title,
      colors: { color },
      linewidth,
      ylabel,
    });
  },

  plotBox(
    { renderingQueueId, chart, time },
    { top, bottom, width, title, color = "#FFF" }
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "box", {
      series: [top, bottom, width],
      title,
      colors: { color },
      ylabel,
    });
  },

  plotCandle(
    { renderingQueueId, chart, time },
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
    chart.computedData.addSetItem(renderingQueueId, time, "candle", {
      series: [open, high, low, close],
      title,
      colors: {
        color,
        wickcolor,
      },
      ylabel,
    });
  },

  // Get value from previous or future data point if exists
  lookback({ dataset, time }, { lookback, source }) {
    const { data, timeframe } = dataset;
    const item = data[time - lookback * timeframe];
    if (item === undefined || item === null) return undefined;
    return item[source];
  },

  plotText() {},

  sma({ dataset, time }, { source, length }) {
    let total = 0;
    for (let i = 0; i < length; i++) {
      total += this.lookback({ dataset, time }, { lookback: i, source });
    }
    return total / length;
  },

  defineGlobal({ globals }, { name, value }) {
    if (!globals[name]) globals[name] = value;
    return globals[name];
  },

  setGlobal({ globals }, { name, value }) {
    globals[name] = value;
    return value;
  },
};
