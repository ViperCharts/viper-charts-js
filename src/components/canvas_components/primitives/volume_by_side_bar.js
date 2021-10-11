import Layer from "../layer.js";

export default class VolumeBySideBar extends Layer {
  constructor({ $state, canvas }) {
    super(canvas);

    this.$state = $state;

    this.screenHeightPerc = 0.2;
    this.upColor = "#C4FF4944";
    this.downColor = "#FE3A6444";

    this.maxVolumeOnScreen = this.getMaxVolumeOnScreen();
    this.lastRange = this.$state.chart.range;
  }

  draw() {
    const r = this.$state.chart.range;
    const lr = this.lastRange;

    // Check if visible timestamp range has changed since last render
    if (lr[0] !== r[0] || lr[1] !== r[1]) {
      this.maxVolumeOnScreen = this.getMaxVolumeOnScreen();
    }

    // Loop through and render all candles
    for (const candle of this.$state.chart.visibleData) {
      const delta = candle.buy_volume - candle.sell_volume;
      const volume = candle.buy_volume + candle.sell_volume;

      const color = delta >= 0 ? this.upColor : this.downColor;

      // Calculate pixels height of current candle
      const { main } =
        this.$state.global.layout.chartDimensions[this.$state.chart.id];
      const maxHeight = this.screenHeightPerc * main.height;
      const volumePerc = volume / this.maxVolumeOnScreen;
      const h = Math.floor(volumePerc * maxHeight);
      const deltaPerc = Math.abs(delta / this.maxVolumeOnScreen);
      const h2 = Math.floor(deltaPerc * maxHeight);

      const x = this.$state.chart.getXCoordByTimestamp(candle.time);
      this.canvas.drawBox(color, [
        x - this.$state.chart.pixelsPerElement / 2 + 1,
        this.canvas.height - h,
        Math.max(this.$state.chart.pixelsPerElement - 1, 1),
        h,
      ]);
      this.canvas.drawBox(color, [
        x - this.$state.chart.pixelsPerElement / 2 + 1,
        this.canvas.height - h2,
        Math.max(this.$state.chart.pixelsPerElement - 1, 1),
        h2,
      ]);
    }

    this.lastRange = { ...r };
  }

  /**
   * Get the maximum volume on screen to calculate pixels per volume qty
   * @returns {number} Maximum volume on screen
   */
  getMaxVolumeOnScreen() {
    let maxVolumeOnScreen = 0;

    // Loop through all visible candles
    for (const { buy_volume, sell_volume } of this.$state.chart.visibleData) {
      const volume = buy_volume + sell_volume;
      if (volume > maxVolumeOnScreen) {
        maxVolumeOnScreen = volume;
      }
    }

    return maxVolumeOnScreen;
  }
}
