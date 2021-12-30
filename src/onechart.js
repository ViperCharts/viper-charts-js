import "./style.css";
import ViperCharts from "./viper.ts";

let Viper = null;

window.make = () => {
  Viper = new ViperCharts({
    element: document.getElementById("chart"),
    settings: {
      global: {
        gridEdit: false,
      },
    },
    onRequestHistoricalData,
  });

  async function onRequestHistoricalData({ requests, callback }) {
    for (let { id, source, name, timeframe, start, end } of requests) {
      const res = await fetch(
        `https://demo-api.vipercharts.com/candles?source=${source}&name=${name}&timeframe=${timeframe}&start=${start}&end=${end}`
      );

      if (!res.ok) {
        callback(id, {});
        return;
      }

      const data = await res.json();

      callback(id, data);
    }
  }

  const timeframe = Viper.Constants.DAY;

  // Get the currently selected chart (only 1 chart initialized)
  const chart = Viper.getSelectedChart();

  // Update the chart name
  chart.setName(
    "Bitcoin will go up to $100k next year 🔓 Prediction by Roko Technologies"
  );

  // Update the chart timeframe to a ms interval
  chart.setTimeframe(timeframe);

  // Add indicators and sources
  chart.addIndicator(Viper.Indicators.map.get("candlestick"), {
    source: "COINBASE",
    name: "BTC-USD",
  });
  chart.addIndicator(Viper.Indicators.map.get("volume"), {
    source: "COINBASE",
    name: "BTC-USD",
  });

  // Set default min and max y scale
  chart.setDefaultRangeBounds({
    min: 40000,
    max: 105000,
  });

  // Set the visible x range
  chart.setVisibleRange({
    start: new Date("11/13/21").getTime(),
    end: new Date("12/31/22").getTime(),
  });
};

window.destroy = () => {
  Viper.destroy();
  Viper = null;
};
