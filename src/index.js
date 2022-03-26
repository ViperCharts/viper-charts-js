import "./style.css";
import ViperCharts from "./viper";

let Viper;

(async () => {
  const res = await fetch(
    "https://api.staging.vipercharts.com/api/markets/get"
  );
  if (!res.ok) {
    alert("An error occurred when fetching available markets.");
    return;
  }

  const sources = await res.json();

  // Actual chart stuff
  Viper = new ViperCharts({
    element: document.getElementById("chart"),
    sources: sources.data,
    settings: JSON.parse(
      localStorage.getItem("settings") ||
        '{"layout":[{"id":"n7zqffwl0bk","chartId":"fcpcec7ub94","top":0,"left":0,"width":100,"height":100,"children":[]}],"charts":{"fcpcec7ub94":{"name":"Untitled Chart","timeframe":3600000,"range":{"start":1647787320000,"end":1648267200000,"min":40546.15,"max":45360.85},"pixelsPerElement":10,"datasetGroups":{"rpbdasptow":{"id":"rpbdasptow","visible":true,"datasets":[{"source":"FTX","name":"BTC-PERP","maxItemsPerRequest":300,"models":[{"id":"price","name":"Price","model":"ohlc"},{"id":"volumeBySide","name":"Volume By Side","model":"volumeBySide"},{"id":"openInterest","name":"Open Interest","model":"ohlc"},{"id":"fundingRate","name":"Funding Rate","model":"value"},{"id":"predictedFundingRate","name":"Predicted Funding Rate","model":"ohlc"},{"id":"footprint","name":"Footprint","model":"footprint"}],"timeframes":[60000,300000,900000,3600000,21600000,86400000]}],"indicators":{"tobki0qfuv":{"version":"1.0.0","name":"Candlestick","dependencies":["ohlc"],"id":"candlestick","type":"bases","visible":true,"datasetId":"FTX:BTC-PERP","model":{"id":"price","name":"Price","model":"ohlc"},"color":"#6f5e9d","renderingQueueId":"tobki0qfuv"}},"synced":{}}},"settings":{"syncRange":false,"syncWithCrosshair":"","lockedYScale":true,"scaleType":"default"}}},"global":{"maxCharts":null,"gridEdit":true}}'
    ),
    onRequestHistoricalData,
    onSaveViperSettings,
  });

  async function onRequestHistoricalData({ requests, callback }) {
    for (let {
      id,
      source,
      name,
      dataModels,
      timeframe,
      start,
      end,
    } of requests) {
      for (const dataModel of dataModels) {
        let path = "timeseries/get";

        if (dataModel === "footprint") {
          path = "footprint/get";
        }

        const res = await fetch(
          `https://api.staging.vipercharts.com/api/${path}?source=${source}&ticker=${name}&dataModel=${dataModel}&timeframe=${timeframe}&start=${start}&end=${end}`
        );

        if (!res.ok) {
          callback(id, {});
          return;
        }

        const { success, data } = await res.json();
        if (!success) {
          callback(id, {});
          return;
        }

        callback(id, data, dataModel);
      }
    }
  }

  function onSaveViperSettings(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
  }
})();
