import Overlay from "./overlay.js";

export default class TimeSelected extends Overlay {
  constructor({ $state, canvas }) {
    super({ canvas, $state });

    this.init(this.draw.bind(this));
  }

  draw() {
    const { x } = this.$state.global.crosshair.crosshairs[this.$state.chart.id];

    if (!this.$state.global.crosshair.visible) return;

    const d = new Date(this.$state.global.crosshair.timestamp);
    const dateText = `${
      d.getMonth() + 1
    }/${d.getDate()}/${d.getFullYear()} ${d.getHours()}:${`0${d.getMinutes()}`.slice(
      -2
    )}`;

    this.canvas.drawBox("#424242", [x - 45, 0, 90, 30]);
    this.canvas.drawText("#fff", [x, 15], dateText);
  }
}
