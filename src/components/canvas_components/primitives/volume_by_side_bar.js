import Layer from "../layer.js";

import chartState from "../../../state/chart.js";

export default class VolumeBySideBar extends Layer {
  constructor({ canvas, screenHeightPerc }) {
    super(canvas);
    this.screenHeightPerc = screenHeightPerc;
    this.upColor = "#C4FF4944";
    this.downColor = "#FE3A6444";

    this.maxVolumeOnScreen = this.getMaxVolumeOnScreen();
    this.lastRange = chartState.range;
  }

  draw() {
    const r = chartState.range;
    const lr = this.lastRange;

    // Check if visible timestamp range has changed since last render
    if (lr[0] !== r[0] || lr[1] !== r[1]) {
      this.maxVolumeOnScreen = this.getMaxVolumeOnScreen();
    }

    // Loop through and render all candles
    for (const candle of chartState.visibleData) {
      const delta = candle.buy_volume - candle.sell_volume;
      const volume = candle.buy_volume + candle.sell_volume;

      const color = delta >= 0 ? this.upColor : this.downColor;

      // Calculate pixels height of current candle
      const maxHeight = this.screenHeightPerc * this.canvas.canvas.height;
      const volumePerc = volume / this.maxVolumeOnScreen;
      const h = Math.floor(volumePerc * maxHeight);
      const deltaPerc = Math.abs(delta / this.maxVolumeOnScreen);
      const h2 = Math.floor(deltaPerc * maxHeight);

      const x = chartState.getXCoordByTimestamp(candle.time);
      this.canvas.drawBox(color, [
        x - chartState.pixelsPerElement / 2 + 1,
        this.canvas.height - h,
        Math.max(chartState.pixelsPerElement - 1, 1),
        h,
      ]);
      this.canvas.drawBox(color, [
        x - chartState.pixelsPerElement / 2 + 1,
        this.canvas.height - h2,
        Math.max(chartState.pixelsPerElement - 1, 1),
        h2,
      ]);
    }
  }

  /**
   * Get the maximum volume on screen to calculate pixels per volume qty
   * @returns {number} Maximum volume on screen
   */
  getMaxVolumeOnScreen() {
    let maxVolumeOnScreen = 0;

    // Loop through all visible candles
    for (const { buy_volume, sell_volume } of chartState.visibleData) {
      const volume = buy_volume + sell_volume;
      if (volume > maxVolumeOnScreen) {
        maxVolumeOnScreen = volume;
      }
    }

    return maxVolumeOnScreen;
  }
}
