import Layer from "./layer.js";

export default class Overlay extends Layer {
  constructor({ canvas, $state }) {
    super();

    this.$state = $state;
    this.canvas = canvas;
  }

  init(drawImplementation) {
    this.drawImplementation = drawImplementation;
    this.canvas.RE.addOverlay(this);
  }

  drawFunc() {
    this.drawImplementation();
  }
}
