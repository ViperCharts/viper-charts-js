import "./style.css";

import Dexie from "dexie";

// Import the library locally. In a production app, you would use:
// import ViperCharts from "@viper-charts/viper-charts"
import ViperCharts from "./viper";

const db = createDB();

let Viper;

main();
async function main() {
  // The sources available to ViperCharts
  const sources = {
    BINANCE: await getSourcesFromBinance(),
  };

  async function getSourcesFromBinance() {
    const res = await fetch("https://www.binance.com/api/v3/exchangeInfo");
    const json = await res.json();

    const sources = {};

    for (const item of json.symbols) {
      sources[item.symbol] = {
        source: "BINANCE",
        name: item.symbol,
        maxItemsPerRequest: 500,
        models: {
          price: {
            id: "price",
            model: "ohlc",
            name: "Price",
            label: `Binance:${item.symbol}`,
          },
        },
      };
    }

    return sources;
  }

  Viper = new ViperCharts({
    element: document.getElementById("chart"),
    sources,
    settings: JSON.parse(localStorage.getItem("settings")) || {},
    onRequestHistoricalData,
    onSaveViperSettings,
    onRequestTemplates,
    onSaveTemplate,
    onDeleteTemplate,
  });
}

async function onRequestHistoricalData({ requests }) {
  for (const { source, name, timeframe, dataModels, start, end } of requests) {
    if (source === "BINANCE") {
      for (const dataModel of dataModels) {
        const tf = {
          60000: "1m",
          [60000 * 5]: "5m",
          [60000 * 15]: "15m",
          [60000 * 60]: "1h",
          [60000 * 60 * 4]: "4h",
          [60000 * 60 * 24]: "1d",
        }[timeframe];

        const res = await fetch(
          `https://www.binance.com/api/v3/klines?symbol=${name}&interval=${tf}&startTime=${start}&endTime=${end}`
        );
        const json = await res.json();

        const data = {};

        for (const item of json) {
          const [timestamp, open, high, low, close] = item;

          const isoString = new Date(timestamp).toISOString();

          data[isoString] = {
            open: +open,
            high: +high,
            low: +low,
            close: +close,
          };
        }

        Viper.addData({ source, name, timeframe, dataModel }, data);
      }
    }
  }
}

function onSaveViperSettings(settings) {
  localStorage.setItem("settings", JSON.stringify(settings));
}

async function onRequestTemplates() {
  return await db.templates.where("id").above(0).toArray();
}

async function onSaveTemplate(id, { name, config }) {
  // Check if template exists at id
  const rows = await db.templates.where("id").equals(id).toArray();
  const row = rows[0];

  if (row) {
    // If so, update it
    await db.templates.update(id, { name, config });
  } else {
    // If not, create it
    await db.templates.add({ name, config });
  }

  return await db.templates.orderBy("id").last();
}

async function onDeleteTemplate(id) {
  await db.templates.delete(id);
}

function createDB() {
  const db = new Dexie("viper");
  db.version(1).stores({
    templates: "++id,name,config",
  });
  return db;
}
