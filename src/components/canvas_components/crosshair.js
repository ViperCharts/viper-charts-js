import Layer from "./layer";

export default class Crosshair extends Layer {
  constructor({ $state, canvas }) {
    super(canvas);

    this.$state = $state;
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
