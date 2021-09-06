import Layer from "../layer.js";

import chartState from "../../../state/chart.js";

export default class VolumeProfile extends Layer {
  constructor({ canvas }) {
    super(canvas);
    this.upColor = "#C4FF49";
    this.downColor = "#FE3A64";

    this.lastRange = chartState.range;
  }

  draw() {
    // Loop through and render all candles
    for (const candle of chartState.visibleData) {
      const w = chartState.pixelsPerElement;

      if (!candle.volumeProfile) continue;
      for (const profile of this.volumeProfile(candle.volumeProfile)) {
        const x = chartState.getXCoordByTimestamp(
          candle.time + chartState.timeframe
        );
        const y = chartState.getYCoordByPrice(profile.price);
        const y2 = chartState.getYCoordByPrice(profile.price - 5);

        const sellPerc = profile.sell_volume / 1000000;
        const sw = sellPerc * w;

        this.canvas.drawBox(this.downColor, [x, y, -sw, y - y2]);

        const buyPerc = profile.buy_volume / 1000000;
        const bw = buyPerc * w;

        this.canvas.drawBox(this.upColor, [x, y, bw, y - y2]);
      }
    }
  }

  volumeProfile(profile) {
    if (!profile) return;

    const newProfile = [];
    const tf = chartState.timeframe;

    for (let i = 0; i < profile.length; i += 5) {
      const nv = {
        price: profile[i].price,
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
