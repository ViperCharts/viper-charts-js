import Layer from "../layer.js";

import chartState from "../../../state/chart.js";

export default class VolumeBar extends Layer {
  constructor({ canvas, screenHeightPerc }) {
    super(canvas);
    this.screenHeightPerc = screenHeightPerc;
    this.upColor = "#009313";
    this.downColor = "#ce0e0e";

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
      const isUp = candle.close >= candle.open;
      const color = isUp ? this.upColor : this.downColor;

      // Calculate pixels height of current candle
      const maxHeight = this.screenHeightPerc * this.canvas.canvas.height;
      const volumePerc = candle.volume / this.maxVolumeOnScreen;
      const h = Math.floor(volumePerc * maxHeight);

      const x = this.canvas.getXCoordByTimestamp(candle.time);
      this.canvas.drawBox(color, [
        x - chartState.pixelsPerElement / 2 + 1,
        this.canvas.height - h,
        Math.max(chartState.pixelsPerElement - 1, 1),
        h,
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
    for (const { volume } of chartState.visibleData) {
      if (volume > maxVolumeOnScreen) {
        maxVolumeOnScreen = volume;
      }
    }

    return maxVolumeOnScreen;
  }
}
