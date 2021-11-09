import "./style.css";
import data from "./footprint.json";
import Chart from "./viperchart";
import Constants from "./constants";

import Utils from "./utils";

// const data = await res.json();
//     for (let i = 0; i < data.candles.length; i++) {
//       newData.push({
//         ...data.candles[i],
//         time: data.candles[i].timestamp * 60 * 1000,
//         volumeProfile: data.volumeProfile[i] && data.volumeProfile[i].profile,
//         volumeRatios: data.volumeRatios[i],
//       });
//     }

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
  const chart = new Chart({
    sources: { COINBASE },
    onRequestHistoricalData,
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
})();
