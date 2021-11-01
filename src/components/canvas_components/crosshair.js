import Overlay from "./overlay";

export default class Crosshair extends Overlay {
  constructor({ $state, canvas }) {
    super({ canvas, $state });

    this.init(this.draw.bind(this));
  }

  draw() {
    if (!this.$state.global.crosshair.visible) return;

    // Draw horizontal line
    const { crosshairs } = this.$state.global.crosshair;
    const { x, y } = crosshairs[this.$state.chart.id];
    this.canvas.drawLine("#ffffff88", [0, y, this.canvas.width, y]);
    this.canvas.drawLine("#ffffff88", [x, 0, x, this.canvas.height]);
  }
}
