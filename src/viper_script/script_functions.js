import GlobalState from "../state/global.js";

const getChart = (id) => GlobalState.charts[id];
const getDataset = (id) => GlobalState.data.datasets[id];

export default {
  plot(
    { renderingQueueId, chart, time },
    series,
    title,
    color,
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
    });
  },

  plotBox({ renderingQueueId, chart, time }, topValue, bottomValue, width) {
    chart.computedData.addSetItem(renderingQueueId, time, "box", {
      series: [topValue, bottomValue, width],
    });
  },

  plotCandle(
    { renderingQueueId, chartId, time },
    open,
    high,
    low,
    close,
    title,
    color,
    wickcolor,
    editable,
    show_last,
    bordercolor
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "candle", {
      series: [open, high, low, close],
    });
  },

  plotText() {},
};
