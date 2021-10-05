import "./style.css";
import data from "./footprint.json";
import Chart from "./chart/chart.js";

import Utils from "./utils";

(async () => {
  // const res = await fetch("https://crypto.moonmath.xyz/ftx-data/btc");
  // const data = await res.json();

  const newData = [];
  for (let i = 0; i < data.candles.length; i++) {
    newData.push({
      ...data.candles[i],
      time: data.candles[i].timestamp * 60 * 1000,
      volumeProfile: data.volumeProfile[i] && data.volumeProfile[i].profile,
      volumeRatios: data.volumeRatios[i],
    });
  }

  const chart = new Chart({
    data: newData,
    layout: [
      {
        id: Utils.uniqueId(),
        top: 0,
        left: 0,
        width: 100,
        height: 100,
        children: [],
      },
    ],
  });
})();
