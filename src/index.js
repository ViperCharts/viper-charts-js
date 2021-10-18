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
    sourceId,
    datasetId,
    start,
    end,
    timeframe,
  }) {
    const seconds = timeframe / 1000;
    const res = await fetch(
      `https://api.exchange.coinbase.com/products/${datasetId}/candles?granularity=${seconds}`
    );
    const data = (await res.json()).reverse().map((data) => ({
      time: data[0] * 1000,
      low: data[1],
      high: data[2],
      open: data[3],
      close: data[4],
      volume: data[5],
    }));

    return data;
  }
})();
