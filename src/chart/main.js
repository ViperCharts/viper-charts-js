import chartState from "../state/chart.js";
import crosshairState from "../state/crosshair.js";
import layoutState from "../state/layout.js";

import Canvas from "../components/canvas.js";
import Background from "../components/canvas_components/background.js";
import Grid from "../components/canvas_components/grid.js";
import Crosshair from "../components/canvas_components/crosshair.js";
import LastPriceLine from "../components/canvas_components/last_price_line.js";

import { series, indicators } from "../components/indicator.js";

export default class Main {
  constructor() {
    this.canvas = new Canvas({
      id: `canvas-${this.id}-main`,
      height: layoutState.height.height - 20,
      width: layoutState.width.width - 50,
      cursor: "crosshair",
    });

    this.scrollListener = null;
    this.mousemoveListener = null;
    this.mouseleaveListener = null;

    this.init();
  }

  init() {
    // Add indicators to it
    new Background({ canvas: this.canvas });
    new Grid({ canvas: this.canvas });
    new LastPriceLine({ canvas: this.canvas });
    new Crosshair({ canvas: this.canvas });

    this.scrollListener = this.canvas.canvas.addEventListener(
      "wheel",
      this.onScroll.bind(this)
    );
    this.mousemoveListener = this.canvas.canvas.addEventListener(
      "mousemove",
      this.onMouseMove.bind(this)
    );
    this.mouseleaveListener = this.canvas.canvas.addEventListener(
      "mouseleave",
      () => crosshairState.crosshair.updateCrosshair(-1, -1)
    );
    layoutState.height.addEventListener("setHeight", (height) =>
      this.canvas.setHeight(height - 20)
    );
    layoutState.width.addEventListener("setWidth", (width) =>
      this.canvas.setWidth(width - 50)
    );
  }

  onScroll(e) {
    if (e.deltaY < 0) chartState.resizeXRange(10, this.canvas.width);
    else if (e.deltaY > 0) chartState.resizeXRange(-10, this.canvas.width);
  }

  onMouseMove(e) {
    crosshairState.crosshair.updateCrosshair(e.offsetX, e.offsetY);
  }
}
