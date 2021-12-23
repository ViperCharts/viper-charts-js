import Overlay from "./overlay.js";

export default class TimeSelected extends Overlay {
  constructor({ $state, canvas }) {
    super({ canvas, $state });

    this.init(this.draw.bind(this));
  }

  draw() {
    const p = this.$state.global.crosshair.price;
    const { y } = this.$state.global.crosshair.crosshairs[this.$state.chart.id];

    if (!this.$state.global.crosshair.visible) return;

    const { width } =
      this.$state.global.layout.chartDimensions[this.$state.chart.id].yScale;

    this.canvas.drawBox("#424242", [0, y - 10, width, 20]);
    this.canvas.drawText("#fff", [width / 2, y + 3], Math.floor(p));
  }
}
