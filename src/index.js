import "./style.css";
import Chart from "./viperchart";
import Constants from "./constants";

let chart;

(async () => {
  const res = await fetch("http://demo-api.vipercharts.com/sources");
  if (!res.ok) {
    alert("An error occurred when fetching available markets.");
    return;
  }

  const sources = await res.json();

  // Actual chart stuff
  chart = new Chart({
    sources,
    initialSettings: JSON.parse(localStorage.getItem("settings") || "{}"),
    onRequestHistoricalData,
    onSaveViperSettings,
  });

  async function onRequestHistoricalData({ requests, callback }) {
    for (let { id, source, name, timeframe, start, end } of requests) {
      const res = await fetch(
        `http://demo-api.vipercharts.com/candles?source=${source}&name=${name}&timeframe=${timeframe}&start=${start}&end=${end}`
      );

      if (!res.ok) {
        callback(id, {});
        return;
      }

      const data = await res.json();

      callback(id, data);
    }
  }

  const settings = {
    layout: [],
    charts: {
      chartId: {
        timeframe: 60000,
        range: {
          start: 12312312,
          end: 23123123,
        },
        indicators: [
          {
            id: "price-line",
            dataset: {
              source: "COINBASE",
              name: "BTC-USD",
            },
          },
        ],
        settings: {
          syncRange: false,
          syncWithCrosshair: "",
          lockedYScale: true,
          scaleType: "percent",
        },
      },
    },
  };

  function onSaveViperSettings(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
  }
})();
