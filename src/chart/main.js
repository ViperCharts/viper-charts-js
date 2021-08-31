import Canvas from "../components/canvas.js";
import Utils from "../utils.js";
import Background from "../components/canvas_components/background.js";
import Grid from "../components/canvas_components/grid.js";

import chartState from "../state/chart.js";
import PriceLine from "../components/canvas_components/primitives/price_line.js";
import Candlestick from "../components/canvas_components/primitives/candlestick.js";
import VolumeBar from "../components/canvas_components/primitives/volume_bar.js";

export default class Main {
  constructor() {
    this.id = Utils.uniqueId();

    this.canvas = new Canvas({
      id: `canvas-${this.id}-main`,
      height: window.innerHeight - 60,
      width: window.innerWidth,
      cursor: "crosshair",
    });

    this.background = new Background({
      canvas: this.canvas,
      color: "#080019",
    });
    this.grid = new Grid({
      canvas: this.canvas,
      color: "#434343",
    });
    this.volumeBar = new VolumeBar({
      canvas: this.canvas,
      screenHeightPerc: 0.2,
    });
    // this.priceLine = new PriceLine({ canvas: this.canvas, color: "#11e067" });
    this.candlestick = new Candlestick({ canvas: this.canvas });

    this.scrollListener = null;

    this.init();
  }

  init() {
    this.scrollListener = this.canvas.canvas.addEventListener(
      "wheel",
      this.onScroll.bind(this)
    );
  }

  onScroll(e) {
    if (e.deltaY < 0) chartState.resizeXRange(10, this.canvas.width);
    else if (e.deltaY > 0) chartState.resizeXRange(-10, this.canvas.width);
  }
}
