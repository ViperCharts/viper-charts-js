import Layer from "../layer.js";

export default class VolumeBar extends Layer {
  constructor({ $state, canvas }) {
    super({ $state, canvas, type: "multi" });

    this.$state = $state;

    this.screenHeightPerc = 0.2;
    this.upColor = "#C4FF4988";
    this.downColor = "#FE3A6488";

    this.maxVolumeOnScreen = this.getMaxVolumeOnScreen();
    this.lastRange = this.$state.chart.range;

    this.consumers = ["volume"];
    this.init(this.draw.bind(this));
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
      const isUp = candle.close >= candle.open;
      const color = isUp ? this.upColor : this.downColor;

      // Calculate pixels height of current candle
      const maxHeight = this.screenHeightPerc * this.canvas.canvas.height;
      const volumePerc = candle.volume / this.maxVolumeOnScreen;
      const h = Math.floor(volumePerc * maxHeight);

      const x = this.$state.chart.getXCoordByTimestamp(candle.time);
      this.canvas.drawBox(color, [
        x - this.$state.chart.pixelsPerElement / 2 + 1,
        this.canvas.height - h,
        Math.max(this.$state.chart.pixelsPerElement - 1, 1),
        h,
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
    for (const { volume } of this.$state.chart.visibleData) {
      if (volume > maxVolumeOnScreen) {
        maxVolumeOnScreen = volume;
      }
    }

    return maxVolumeOnScreen;
  }
}
