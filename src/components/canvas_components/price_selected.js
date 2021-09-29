import Layer from "./layer.js";

export default class TimeSelected extends Layer {
  constructor({ $state, canvas }) {
    super(canvas);

    this.$state = $state;
  }

  draw() {
    const p = this.$state.global.crosshair.crosshair.price;
    const y = this.$state.global.crosshair.crosshair.y;

    if (y < 0) return;

    this.canvas.drawBox("#424242", [0, y - 10, 50, 20]);
    this.canvas.drawText("#fff", [25, y + 3], p);
  }
}
