import "./style.css";
import Chart from "./chart/chart.js";
import data from "./footprint.json";

let chart;

(async () => {
  // const res = await fetch("https://crypto.moonmath.xyz/ftx-data/btc");
  // const data = await res.json();

  const newData: any = [];
  for (let i = 0; i < data.candles.length; i++) {
    newData.push({
      ...data.candles[i],
      time: data.candles[i].timestamp * 60 * 1000,
      volumeProfile: data.volumeProfile[i] && data.volumeProfile[i].profile,
      volumeRatios: data.volumeRatios[i],
    });
  }

  chart = new Chart({
    data: newData,
    width: window.innerWidth,
    height: window.innerHeight,
    element: document.querySelector("#app"),
  });
})();
