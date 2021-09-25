class Indicator {
  constructor(name, dataSources, c) {
    this.name = name;
    this.dataSources = dataSources;
    this.class = c;
  }
}

import Candlestick from "./canvas_components/primitives/candlestick.js";
import PriceLine from "./canvas_components/primitives/price_line.js";
import Footprint from "./canvas_components/primitives/footprint.js";

export const series = [
  new Indicator("Candlestick", [], Candlestick),
  new Indicator("Footprint", [], Footprint),
  new Indicator("Price Line", [], PriceLine),
];

import VolumeBar from "./canvas_components/primitives/volume_bar.js";
import VolumeBySideBar from "./canvas_components/primitives/volume_by_side_bar.js";

export const indicators = [
  new Indicator("Volume", [], VolumeBar),
  new Indicator("Volume By Side", [], VolumeBySideBar),
];
