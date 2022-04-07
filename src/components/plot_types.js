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

  footprint: {
    version: "1.0.0",
    name: "Footprint",
    dependencies: ["footprint"],
    draw({ spread, prices, plotBox, times }) {
      for (let price in prices) {
        price = +price;
        const { buy, sell } = prices[price];
        if (buy) {
          plotBox({
            top: price + spread,
            bottom: price,
            width: buy / spread / 3,
            color: "#C4FF49",
          });
        }
        if (sell) {
          plotBox({
            top: price + spread,
            bottom: price,
            width: -sell / spread / 3,
            color: "#FE3A64",
          });
        }
      }
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
    draw({ plot, sma, math, setVar, getVar }) {
      const ma20 = sma({ source: "value", length: 20 });
      setVar({ name: "ma20", value: ma20 });

      const slope = math.sub(ma20, getVar({ name: "ma20", lookback: 1 }));

      plot({
        value: slope,
        title: "MA20 Slope",
        color: this.color,
        linewidth: 2,
        ylabel: true,
      });
    },
  },

  bbands: {
    version: "1.0.0",
    name: "Bollinger Bands",
    dependencies: ["value"],
    draw({ plot, fill, bbands }) {
      const [middle, upper, lower] = bbands({
        source: "value",
        length: 20,
        multiplier: 2,
      });

      fill({
        value1: upper,
        value2: lower,
        color: "#5142f511",
      });
      plot({
        value: middle,
        color: "#ba7d13",
        linewidth: 1,
      });
      plot({
        value: upper,
        color: "#5142f5",
        linewidth: 1,
      });
      plot({
        value: lower,
        color: "#5142f5",
        linewidth: 1,
      });
    },
  },

  bbw: {
    version: "1.0.0",
    name: "Bollinger Bands Width",
    dependencies: ["value"],
    draw({ plot, bbands, math }) {
      const [middle, upper, lower] = bbands({
        source: "value",
        length: 20,
        multiplier: 2,
      });

      plot({
        value: +math.divide(math.sub(upper, lower), middle).toFixed(4),
        color: this.color,
        linewidth: 2,
        ylabel: true,
      });
    },
  },

  "zero-bars": {
    version: "1.0.0",
    name: "Zero Bars",
    dependencies: ["value"],
    draw({ plotBox, value }) {
      plotBox({
        top: value >= 0 ? value : 0,
        bottom: value >= 0 ? 0 : value,
        width: 0.9,
        color: value >= 0 ? "#C4FF49" : "#FE3A64",
      });
    },
  },

  deltafootprint: {
    version: "1.0.0",
    name: "Delta Footprint",
    dependencies: ["footprint"],
    draw({ spread, prices, plotBox }) {
      for (let price in prices) {
        price = +price;
        const { buy, sell } = prices[price];
        const delta = buy - sell;
        plotBox({
          top: price + spread,
          bottom: price,
          width: Math.abs(delta),
          color: delta >= 0 ? "#C4FF49" : "#FE3A64",
        });
      }
    },
  },

  volumePerTick: {
    version: "1.0.0",
    name: "Volume Per Tick",
    dependencies: ["footprint"],
    draw({ spread, prices, plotBox }) {
      const keys = Object.keys(prices);
      const ticks = Math.max(
        Math.abs(keys[0] - keys[keys.length - 1]) / spread,
        spread
      );
      let buys = 0;
      let sells = 0;
      for (const price in prices) {
        buys += prices[price].buy;
        sells += prices[price].sell;
      }
      const total = buys + sells;
      const bpt = (buys / ticks) * total;
      const spt = (sells / ticks) * total;
      const delta = bpt - spt;

      plotBox({
        top: Math.floor(bpt),
        bottom: 0,
        width: 1,
        center: true,
        color: "#C4FF4966",
      });
      plotBox({
        top: 0,
        bottom: -Math.ceil(spt),
        width: 1,
        center: true,
        color: "#FE3A6466",
      });
      plotBox({
        top: delta > 0 ? Math.floor(delta) : 0,
        bottom: delta > 0 ? 0 : Math.floor(delta),
        width: 1,
        center: true,
        color: delta > 0 ? "#C4FF49" : "#FE3A64",
      });
    },
  },

  volumeProfileSession: {
    version: "1.0.0",
    name: "Volume Profile Session",
    dependencies: ["footprint"],
    draw({ spread, prices, plotBox }) {
      let max = 0;
      const pricesCopy = {};

      for (const price in prices) {
        const { buy, sell } = prices[price];
        const total = buy + sell;
        const delta = buy - sell;

        pricesCopy[price] = {
          total,
          delta,
        };

        if (total > max) max = total;
      }

      for (let price in pricesCopy) {
        price = +price;
        const { total, delta } = pricesCopy[price];

        plotBox({
          top: price + spread,
          bottom: price,
          width: (total / max) * 0.9,
          color: delta >= 0 ? "#C4FF49AA" : "#FE3A64AA",
        });

        plotBox({
          top: price + spread,
          bottom: price,
          width: (Math.abs(delta) / max) * 0.9,
          color: delta >= 0 ? "#C4FF49" : "#FE3A64",
        });
      }
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
