import Canvas from "../components/canvas.js";
import Utils from "../utils.js";
import Background from "../components/canvas_components/background.js";
import Grid from "../components/canvas_components/grid.js";

import chartState from "../state/chart.js";
import crosshairState from "../state/crosshair.js";
import layoutState from "../state/layout.js";

import PriceLine from "../components/canvas_components/primitives/price_line.js";
import Candlestick from "../components/canvas_components/primitives/candlestick.js";
import VolumeBar from "../components/canvas_components/primitives/volume_bar.js";
import Crosshair from "../components/canvas_components/crosshair.js";
import LastPriceLine from "../components/canvas_components/last_price_line.js";
import ScriptLoader from "../components/canvas_components/script_loader.js";

import TestScript from "../viper_script/default_scripts/test.js";
import VolumeBySideBar from "../components/canvas_components/primitives/volume_by_side_bar.js";
import VolumeProfile from "../components/canvas_components/primitives/volume_profile.js";

export default class Main {
  constructor() {
    this.id = Utils.uniqueId();

    this.canvas = new Canvas({
      id: `canvas-${this.id}-main`,
      height: layoutState.height.height - 20,
      width: layoutState.width.width - 50,
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
    // this.volumeBar = new VolumeBar({
    //   canvas: this.canvas,
    //   screenHeightPerc: 0.2,
    // });
    new VolumeBySideBar({
      canvas: this.canvas,
      screenHeightPerc: 0.2,
    });
    // this.priceLine = new PriceLine({ canvas: this.canvas, color: "#11e067" });
    // this.candlestick = new Candlestick({ canvas: this.canvas });
    new VolumeProfile({
      canvas: this.canvas,
    });
    this.lastPriceLine = new LastPriceLine({ canvas: this.canvas });
    this.crosshair = new Crosshair({ canvas: this.canvas });
    // new ScriptLoader({
    //   canvas: this.canvas,
    //   func: TestScript,
    // });

    this.scrollListener = null;
    this.mousemoveListener = null;
    this.mouseleaveListener = null;

    this.init();
  }

  init() {
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
    crosshairState.crosshair.updateCrosshair(e.x, e.y);
  }
}
