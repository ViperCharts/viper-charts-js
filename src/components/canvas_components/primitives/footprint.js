import Layer from "../layer.js";

function nFormatter(num, digits) {
  const lookup = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var item = lookup
    .slice()
    .reverse()
    .find(function (item) {
      return num >= item.value;
    });
  return item
    ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol
    : "0";
}

export default class VolumeProfile extends Layer {
  constructor({ $state, canvas }) {
    super({ $state, canvas, type: "multi" });

    this.$state = $state;

    this.upColor = "#8BB532";
    this.downColor = "#FE3A64";

    this.lastRange = this.$state.chart.range;

    this.consumers = ["volumeProfile", "time"];
    this.init(this.draw.bind(this));
  }

  draw() {
    // Loop through and render all candles
    for (const candle of this.$state.chart.visibleData.data) {
      const w = this.$state.chart.pixelsPerElement;

      if (!candle.volumeProfile) continue;
      for (const profile of this.volumeProfile(candle.volumeProfile)) {
        const x = this.$state.chart.getXCoordByTimestamp(
          candle.time + this.$state.chart.timeframe
        );
        const y = this.$state.chart.getYCoordByPrice(profile.price);
        const y2 = this.$state.chart.getYCoordByPrice(profile.price - 5);

        const pixelsPerRow = y2 - y;

        // const sellPerc = Math.min(profile.sell_volume / 2500000, 1);
        const sellPerc = profile.sell_volume / 1000000;
        const sw = sellPerc * w;

        this.canvas.drawBox(this.downColor, [x, y, -sw, y - y2]);

        // const buyPerc = Math.min(profile.buy_volume / 2500000, 1);
        const buyPerc = profile.buy_volume / 1000000;
        const bw = buyPerc * w;

        this.canvas.drawBox(this.upColor, [x, y, bw, y - y2]);

        // If zoomed in on y axis, draw buy / sell values
        // if (pixelsPerRow >= 20) {
        //   this.canvas.drawText(
        //     "#fff",
        //     [x + 5, y - pixelsPerRow / 2],
        //     nFormatter(profile.buy_volume),
        //     { textAlign: "left", strokeText: true }
        //   );
        //   this.canvas.drawText(
        //     "#fff",
        //     [x - 5, y - pixelsPerRow / 2],
        //     nFormatter(profile.sell_volume),
        //     { textAlign: "right", strokeText: true }
        //   );
        // }

        // const barColor =
        //   candle.close >= candle.open ? this.upColor : this.downColor;
        // const time = candle.time - this.$state.chart.timeframe / 2;
        // this.canvas.drawLineByPriceAndTime(barColor, [
        //   time,
        //   candle.open,
        //   time,
        //   candle.close,
        // ]);
      }
    }
  }

  volumeProfile(profile) {
    if (!profile) return;

    const newProfile = [];

    for (let i = 0; i < profile.length; i += 5) {
      const nv = {
        price: profile[i].price - (profile[i].price % 5),
        buy_volume: 0,
        sell_volume: 0,
      };

      for (let j = 0; j < 5; j++) {
        const node = profile[i + j];
        if (!node) continue;
        nv.buy_volume += node.buy_volume;
        nv.sell_volume += node.sell_volume;
      }

      newProfile.push(nv);
    }

    return newProfile;
  }
}
