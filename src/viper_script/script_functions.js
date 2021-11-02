import GlobalState from "../state/global.js";

export default {
  plot(
    { renderingQueueId, chart, time },
    series,
    title,
    color = "#FFF",
    linewidth,
    style,
    trackprice,
    transp,
    histbase,
    offset,
    join,
    editable,
    show_last
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "line", {
      series: [series],
      colors: { color },
    });
  },

  plotBox(
    { renderingQueueId, chart, time },
    topValue,
    bottomValue,
    width,
    title,
    color = "#FFF"
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "box", {
      series: [topValue, bottomValue, width],
      colors: { color },
    });
  },

  plotCandle(
    { renderingQueueId, chart, time },
    open,
    high,
    low,
    close,
    title,
    color = "#FFF",
    wickcolor = "#FFF",
    editable,
    show_last,
    bordercolor
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "candle", {
      series: [open, high, low, close],
      colors: {
        color,
        wickcolor,
      },
    });
  },

  plotText() {},
};
