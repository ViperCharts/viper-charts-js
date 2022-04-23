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
    settings: JSON.parse(localStorage.getItem("settings")),
    onRequestHistoricalData,
    onSaveViperSettings,
    onRequestTemplates,
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

  async function onRequestTemplates() {
    const res = await fetch(
      "https://api.staging.vipercharts.com/api/templates/get"
    );
    return (await res.json()).data;
  }
})();
