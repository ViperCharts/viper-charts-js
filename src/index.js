import "./style.css";
import ViperCharts from "./viper.ts";

let Viper;

(async () => {
  const res = await fetch("https://demo-api.vipercharts.com/sources");
  if (!res.ok) {
    alert("An error occurred when fetching available markets.");
    return;
  }

  const sources = await res.json();

  // Actual chart stuff
  Viper = new ViperCharts({
    element: document.getElementById("chart"),
    sources,
    initialSettings: JSON.parse(localStorage.getItem("settings") || "{}"),
    onRequestHistoricalData,
    onSaveViperSettings,
  });

  async function onRequestHistoricalData({ requests, callback }) {
    for (let { id, source, name, timeframe, start, end } of requests) {
      const res = await fetch(
        `https://demo-api.vipercharts.com/candles?source=${source}&name=${name}&timeframe=${timeframe}&start=${start}&end=${end}`
      );

      if (!res.ok) {
        callback(id, {});
        return;
      }

      const data = await res.json();

      callback(id, data);
    }
  }

  function onSaveViperSettings(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
  }
})();
