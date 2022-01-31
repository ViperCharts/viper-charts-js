export default {
  "price-line": {
    id: "price-line",
    name: "Price Line",
    draw({ close, plot }) {
      plot({
        value: close,
        title: "Price line",
        color: this.color,
        linewidth: 2,
        ylabel: true,
      });
    },
  },

  candlestick: {
    id: "candlestick",
    name: "Candlestick",
    draw({ open, high, low, close, plotCandle }) {
      const color = close >= open ? "#C4FF49" : "#FE3A64";
      plotCandle({
        open,
        high,
        low,
        close,
        title: "Candlestick",
        color,
        wickcolor: color,
        ylabel: true,
      });
    },
  },

  sma: {
    id: "sma",
    name: "SMA",
    draw({ plot, sma }) {
      const ma20 = sma({ source: "close", length: 20 });

      plot({
        value: ma20,
        title: "MA20",
        color: this.color,
        linewidth: 2,
      });
    },
  },

  "ma-slope": {
    id: "ma-slope",
    name: "MA Slope",
    draw({ plot, sma, setVar, getVar }) {
      const ma20 = sma({ source: "close", length: 20 });
      setVar({ name: "ma20", value: ma20 });

      const slope = ma20 - getVar({ name: "ma20", lookback: 1 });

      plot({
        value: slope,
        title: "MA20 Slope",
        color: this.color,
        linewidth: 2,
        ylabel: true,
      });
    },
  },

  "volume-bar": {
    id: "volume-bar",
    name: "Volume",
    draw({ open, close, volume, plotVolume }) {
      const isUp = close >= open;
      const color = isUp ? this.upColor : this.downColor;

      plotVolume({ volume, color });
    },
  },
};
