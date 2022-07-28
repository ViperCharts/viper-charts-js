import "./style.css";
import ViperCharts from "./viper";

const apiURL =
  process.env.NODE_ENV === "production"
    ? "https://api.vipercharts.com"
    : "http://localhost:3000";

const wsURL =
  process.env.NODE_ENV === "production"
    ? "wss://api.vipercharts.com"
    : "ws://localhost:3000";

let Viper;

// Firefox is broken
if (typeof InstallTrigger !== "undefined") {
  alert(
    "Sorry, but FireFox is currently not supported. Please use Chrome, Brave, Opera, or any other chromium browser. A fix is planned before launch."
  );
}

const subs = new Set();

const socket = new WebSocket(wsURL);

(async () => {
  await new Promise((r) => {
    socket.addEventListener("open", () => {
      console.log("Connected to viper socket");
      r();

      // Ping the server every 15 seconds
      setInterval(() => {
        socket.send(JSON.stringify({ event: "ping" }));
      }, 15e3);
    });
    socket.addEventListener("disconnect", () =>
      console.log("Disconnected from Viper API")
    );
    socket.addEventListener("message", ({ data }) => {
      data = JSON.parse(data);
      if (data.event === "updates") {
        for (const datasetId in data.data) {
          const [source, name, timeframe, dataModel] = datasetId.split(":");

          const d = {};
          for (const time in data.data[datasetId]) {
            d[new Date(+time).toISOString()] = data.data[datasetId][time];
          }

          Viper.addData({ source, name, timeframe, dataModel }, d);
        }
      }
    });
  });

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
    const now = Date.now();
    const timeseries = [];

    for (let { source, name, timeframe, dataModels, start, end } of requests) {
      for (const dataModel of dataModels) {
        // If start and end are the same, ignore
        if (start === end) {
          console.log(new Date(start), new Date(end));
          continue;
        }

        timeseries.push({
          source,
          name,
          dataModel,
          timeframe,
          start,
          end,
        });

        // If end time is greater than current time, subscribe to real time data
        if (end >= now) {
          const id = `${source}:${name}:${timeframe}:${dataModel}`;
          if (subs.has(id)) continue;

          socket.send(
            JSON.stringify({
              event: "subscribe",
              data: { source, name, timeframe, dataModel },
            })
          );

          subs.add(id);
        }
      }
    }

    for (let i = 0; i < timeseries.length; i += 25) {
      (async () => {
        const sources = timeseries.slice(i, i + 25);

        const res = await fetch(`${apiURL}/api/timeseries/get`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sources,
          }),
        });

        const { data } = await res.json();

        for (let { source, name, timeframe, dataModel } of sources) {
          timeframe = +timeframe;
          const resId = `${source}:${name}:${timeframe}:${dataModel}`;

          const d = {};
          if (data[resId]) {
            for (const ts in data[resId].data) {
              d[new Date(+ts).toISOString()] = data[resId].data[ts];
            }
          }

          Viper.addData({ source, name, timeframe, dataModel }, d);
        }
      })();
    }
  }

  function onRemoveDatasetModel({ source, name, timeframe, dataModel }) {
    socket.send(
      JSON.stringify({
        event: "unsubscribe",
        data: { source, name, timeframe, dataModel },
      })
    );
    subs.delete(`${source}:${name}:${timeframe}:${dataModel}`);
  }

  function onSaveViperSettings(settings) {
    localStorage.setItem("settings", JSON.stringify(settings));
  }

  async function onRequestTemplates() {
    const res = await fetch(`${apiURL}/api/templates/get`);
    return (await res.json()).data;
  }
})();
