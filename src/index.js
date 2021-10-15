import "./style.css";
import data from "./footprint.json";
import Chart from "./viperchart";
import Constants from "./constants";

import Utils from "./utils";

const newData = [];
for (let i = 0; i < data.candles.length; i++) {
  newData.push({
    ...data.candles[i],
    time: data.candles[i].timestamp * 60 * 1000,
    volumeProfile: data.volumeProfile[i] && data.volumeProfile[i].profile,
    volumeRatios: data.volumeRatios[i],
  });
}

// Actual chart stuff
const chart = new Chart({
  sources: {
    FTX: [
      {
        name: "BTC-PERP",
        timeframes: [
          Constants.MINUTE,
          Constants.MINUTE15,
          Constants.HOUR,
          Constants.HOUR4,
          Constants.DAY,
          Constants.WEEK,
          Constants.MONTH,
        ],
      },
      {
        name: "ETH-PERP",
        timeframes: [
          Constants.MINUTE,
          Constants.MINUTE15,
          Constants.HOUR,
          Constants.HOUR4,
          Constants.DAY,
          Constants.WEEK,
          Constants.MONTH,
        ],
      },
    ],
  },
  onRequestHistoricalData,
});

function onRequestHistoricalData({ start, end, timeframe }) {}
