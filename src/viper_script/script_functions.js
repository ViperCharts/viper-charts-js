import GlobalState from "../state/global.js";

const getChart = (id) => GlobalState.charts[id];
const getDataset = (id) => GlobalState.data.datasets[id];

export default {
  plot({ value }, { renderingQueueId, chartId, datasetId, time }) {
    const chart = getChart(chartId);
    chart.computedData.addSetItem(renderingQueueId, time, "line", {
      series: [value],
    });
  },

  plotBox(
    { topValue, bottomValue, width },
    { renderingQueueId, chartId, datasetId, time }
  ) {
    const chart = getChart(chartId);
    chart.computedData.addSetItem(renderingQueueId, time, "box", {
      series: [topValue, bottomValue, width],
    });
  },

  plotText() {},
};
