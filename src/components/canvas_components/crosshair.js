import Layer from "./layer";

export default class Crosshair extends Layer {
  constructor({ $state, canvas }) {
    super(canvas);

    this.$state = $state;
  }

  draw() {
    // Draw horizontal line
    const { x, y } = this.$state.global.crosshair.crosshair;
    if (x < 0 || y < 0) return;
    this.canvas.drawLine("#ffffff88", [0, y, this.canvas.width, y]);
    this.canvas.drawLine("#ffffff88", [x, 0, x, this.canvas.height]);
  }
}
