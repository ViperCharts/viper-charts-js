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

  async function onRequestHistoricalData({
    source,
    name,
    timeframe,
    start,
    end,
  }) {
    if (source === "COINBASE") {
      const seconds = timeframe / 1000;
      const res = await fetch(
        `https://api.exchange.coinbase.com/products/${name}/candles?granularity=${seconds}`
      );

      const json = (await res.json()).reverse();
      const data = {};
      for (const item of json) {
        data[item[0] * 1000] = {
          low: item[1],
          high: item[2],
          open: item[3],
          close: item[4],
          volume: item[5],
        };
      }

      return data;
    }
  }
})();
