import "./style.css";
import ViperCharts from "./viper";

let Viper;

// Datasets / dataModels we are subscribed to so we can pull every 5 seconds
const subscriptions = new Set();

const apiURL =
  process.env.NODE_ENV === "production"
    ? "https://api.staging.vipercharts.com"
    : "http://localhost:3001";

(async () => {
  const res = await fetch(`${apiURL}/api/markets/get`);
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
    onRemoveDatasetModel,
    onSaveViperSettings,
    onRequestTemplates,
  });

  async function onRequestHistoricalData({ requests }) {
    const { timeframe, start, end } = requests[0];
    const timeseries = [];

    for (let { source, name, dataModels } of requests) {
      for (const dataModel of dataModels) {
        timeseries.push({ source, ticker: name, dataModel });
      }
    }

    for (let i = 0; i < timeseries.length; i += 25) {
      (async () => {
        const sources = timeseries.slice(i, i + 25);

        const res = await fetch(`${apiURL}/api/timeseries/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            timeframe,
            start,
            end,
            sources,
          }),
        });

        const { data } = await res.json();

        for (const { source, ticker, dataModel } of sources) {
          const resId = `${source}:${ticker}:${dataModel}`;

          let d = {};
          if (data[resId]) {
            d = data[resId].data;
          }

          subscriptions.add(`${source}:${ticker}:${timeframe}:${dataModel}`);
          Viper.addData({ source, name: ticker, timeframe, dataModel }, d);
        }
      })();
    }
  }

  function onRemoveDatasetModel({ source, name, timeframe, dataModel }) {
    subscriptions.delete(`${source}:${name}:${timeframe}:${dataModel}`);
  }

  function onSaveViperSettings(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
  }

  async function onRequestTemplates() {
    const res = await fetch(`${apiURL}/api/templates/get`);
    return (await res.json()).data;
  }

  setInterval(() => {
    const arr = Array.from(subscriptions.values());
    if (!arr.length) return;

    const tfReqs = {};

    for (const sub of arr) {
      const [source, name, timeframe, dataModel] = sub.split(":");
      if (!tfReqs[timeframe]) tfReqs[timeframe] = [];
      tfReqs[timeframe].push({ source, name, dataModel });
    }

    const now = Date.now();
    for (let timeframe in tfReqs) {
      timeframe = +timeframe;
      const requests = [];

      const start = now - (now % timeframe);
      const end = start + timeframe;

      for (const { source, name, dataModel } of tfReqs[timeframe]) {
        requests.push({
          source,
          name,
          timeframe,
          dataModels: [dataModel],
          start,
          end,
        });
      }

      onRequestHistoricalData({ requests });
    }
  }, 5000);
})();
