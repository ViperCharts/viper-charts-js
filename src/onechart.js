import "./style.css";
import ViperCharts from "./viperchart";

const Viper = new ViperCharts({
  element: document.getElementById("chart"),
});

getData();

async function getData() {
  const res = await fetch(
    "https://api.exchange.coinbase.com/products/BTC-USD/candles?granularity=86400"
  );
  const json = await res.json();

  // Object for ohlcv data,
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

  Viper.addDataset({
    source: "COINBSE",
    name: "BTC-USD",
    timeframe: Viper.Constants.DAY,
    data,
  });

  const chart = Viper.getSelectedChart();
  chart.setName(
    "Bitcoin will go up to $100k next year 🔓 Prediction by Roko Technologies"
  );
  chart.setTimeframe(Viper.Constants.DAY);

  chart.addIndicator(Viper.Indicators.map.get("candlestick"), {
    source: "COINBSE",
    name: "BTC-USD",
  });
  chart.addIndicator(Viper.Indicators.map.get("volume"), {
    source: "COINBSE",
    name: "BTC-USD",
  });

  chart.setVisibleRange({
    start: new Date("11/13/21").getTime(),
    end: new Date("12/31/22").getTime(),
    min: 0,
    max: 100000,
  });
}
