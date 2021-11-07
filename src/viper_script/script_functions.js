import GlobalState from "../state/global.js";

export default {
  plot(
    { renderingQueueId, chart, time },
    { value, title, color = "#FFF", linewidth }
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "line", {
      series: [value],
      title,
      colors: { color },
      linewidth,
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
    });
  },

  plotCandle(
    { renderingQueueId, chart, time },
    { open, high, low, close, title, color = "#FFF", wickcolor = "#FFF" }
  ) {
    chart.computedData.addSetItem(renderingQueueId, time, "candle", {
      series: [open, high, low, close],
      title,
      colors: {
        color,
        wickcolor,
      },
    });
  },

  plotText() {},

  // TODO add more functions
  sma({ renderingQueueId, chart, time, index }, source, length) {},
};
