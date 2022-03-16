import "./style.css";
import ViperCharts from "./viper";

let Viper;

(async () => {
  const res = await fetch("http://localhost:3001/api/markets/get");
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
        '{"layout":[{"id":"t02ks9pmxx7","chartId":"jsmtlxwdh9","top":0,"left":0,"width":100,"height":100,"children":[]}],"charts":{"jsmtlxwdh9":{"name":"Untitled Chart","timeframe":3600000,"range":{"start":1643578536685.5278,"end":1644519600000,"min":35777.15,"max":46003.85},"pixelsPerElement":4.299816959998681,"datasetGroups":{"d4tpj06ktj":{"id":"d4tpj06ktj","visible":true,"datasets":[{"source":"FTX","name":"BTC-PERP","timeframes":[60000,300000,900000,3600000,86400000]}],"indicators":{"bq7bicnvx0d":{"id":"candlestick","name":"Candlestick","visible":true,"datasetId":"FTX:BTC-PERP","color":"#128cdf","renderingQueueId":"bq7bicnvx0d"},"drq2078luda":{"id":"sma","name":"SMA","visible":true,"datasetId":"FTX:BTC-PERP","color":"#5ea09b","renderingQueueId":"drq2078luda"}},"synced":{}}},"settings":{"syncRange":false,"syncWithCrosshair":"","lockedYScale":true,"scaleType":"default"}}},"global":{"maxCharts":null,"gridEdit":true}}'
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
          `http://localhost:3001/api/${path}?source=${source}&ticker=${name}&dataModel=${dataModel}&timeframe=${timeframe}&start=${start}&end=${end}`
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
