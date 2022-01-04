export default {
  priceLine({ close, plot }) {
    plot({
      value: close,
      title: "Price line",
      color: this.color,
      linewidth: 2,
      ylabel: true,
    });
  },

  candlestick({ open, high, low, close, plotCandle }) {
    const color = close >= open ? this.upColor : this.downColor;
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

  sma({ plot, sma }) {
    const ma20 = sma({ source: "close", length: 20 });

    plot({
      value: ma20,
      title: "MA20",
      color: this.color,
      linewidth: 2,
      ylabel: true,
    });
  },

  maSlope({ plot, sma, setVar, getVar }) {
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

  volumeBar({ open, close, volume, plotVolume }) {
    const isUp = close >= open;
    const color = isUp ? this.upColor : this.downColor;

    plotVolume({ volume, color });
  },
};
