import "./style.css";
import Chart from "./viperchart";
import Constants from "./constants";

let chart;

(async () => {
  const pairs = await (
    await fetch("https://api.exchange.coinbase.com/products")
  ).json();

  const COINBASE = pairs.map((pair) => ({
    source: "COINBASE",
    name: pair.id,
    maxItemsPerRequest: 300,
    timeframes: [
      Constants.MINUTE,
      Constants.MINUTE5,
      Constants.MINUTE15,
      Constants.HOUR,
      Constants.HOUR * 6,
      Constants.DAY,
    ],
  }));

  // Actual chart stuff
  chart = new Chart({
    sources: { COINBASE },
    initialSettings: JSON.parse(localStorage.getItem("settings") || "{}"),
    onRequestHistoricalData,
    onSaveViperSettings,
  });

  async function onRequestHistoricalData({ requests, callback }) {
    for (let { id, source, name, timeframe, start, end } of requests) {
      if (source === "COINBASE") {
        start = new Date(start).toISOString();
        end = new Date(end).toISOString();

        const seconds = timeframe / 1000;
        const res = await fetch(
          `https://api.exchange.coinbase.com/products/${name}/candles?granularity=${seconds}&start=${start}&end=${end}`
        );

        if (res.status !== 200) {
          return;
        }

        const data = {};

        const json = (await res.json()).reverse();
        for (const item of json) {
          data[item[0] * 1000] = {
            low: item[1],
            high: item[2],
            open: item[3],
            close: item[4],
            volume: item[5],
          };
        }

        callback(id, data);
      }
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
