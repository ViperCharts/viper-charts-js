import "./style.css";
import ViperChart from "./viperchart";

let Viper;

console.log(ViperChart);

(async () => {
  const res = await fetch("https://demo-api.vipercharts.com/sources");
  if (!res.ok) {
    alert("An error occurred when fetching available markets.");
    return;
  }

  const sources = await res.json();

  // Actual chart stuff
  Viper = new ViperChart.Viper({
    sources,
    // initialSettings: JSON.parse(localStorage.getItem("settings") || "{}"),
    onRequestHistoricalData,
    onSaveViperSettings,
  });

  const chart = Viper.createChart({ name: "My First Chart" });

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
    // localStorage.setItem("settings", JSON.stringify(settings));
  }
})();
