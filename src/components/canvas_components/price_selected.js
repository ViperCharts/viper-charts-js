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

    this.canvas.drawBox("#424242", [0, y - 10, 50, 20]);
    this.canvas.drawText("#fff", [25, y + 3], p);
  }
}
