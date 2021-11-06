import Overlay from "./overlay.js";

export default class PlottedLineValues extends Overlay {
  constructor({ $state, canvas }) {
    super({ $state, canvas });

    this.color = "#080019";

    this.init(this.draw.bind(this));
  }

  draw() {}
}
