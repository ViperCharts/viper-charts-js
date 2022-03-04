const bases = {
  line: {
    version: "1.0.0",
    name: "Line",
    dependencies: ["value"],
    draw({ value, plot }) {
      plot({
        value,
        title: "Line",
        color: this.color,
        linewidth: 2,
        ylabel: true,
      });
    },
  },

  candlestick: {
    version: "1.0.0",
    name: "Candlestick",
    dependencies: ["ohlc"],
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
};

const volume = {
  "volume-bar": {
    version: "1.0.0",
    name: "Volume",
    dependencies: ["ohlc", "volume"],
    draw({ open, close, plotVolume }) {
      const isUp = close >= open;
      const color = isUp ? this.upColor : this.downColor;

      plotVolume({ volume, color });
    },
  },
};

const indicators = {
  sma: {
    version: "1.0.0",
    name: "SMA",
    dependencies: ["value"],
    draw({ plot, sma }) {
      const ma20 = sma({ source: "value", length: 20 });

      plot({
        value: ma20,
        title: "MA20",
        color: this.color,
        linewidth: 2,
      });
    },
  },

  "ma-slope": {
    version: "1.0.0",
    name: "MA Slope",
    dependencies: ["value"],
    draw({ plot, sma, setVar, getVar }) {
      const ma20 = sma({ source: "value", length: 20 });
      setVar({ name: "ma20", value: ma20 });

      const slope = ma20 - getVar({ name: "value", lookback: 1 });

      plot({
        value: slope,
        title: "MA20 Slope",
        color: this.color,
        linewidth: 2,
        ylabel: true,
      });
    },
  },
};

const types = {
  bases,
  volume,
  indicators,
};

for (const type in types) {
  for (const indicatorId in types[type]) {
    const indicator = types[type][indicatorId];
    indicator.id = indicatorId;
    indicator.type = type;
  }
}

export default {
  ...types,
  getIndicatorById: (id) => {
    for (const type in types) {
      for (const indicatorId in types[type]) {
        if (indicatorId === id) return types[type][indicatorId];
      }
    }
  },
};
