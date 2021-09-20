class Indicator {
  constructor(name, dataSources, c) {
    this.name = name;
    this.dataSources = dataSources;
    this.class = c;
  }
}

import Candlestick from "./canvas_components/primitives/candlestick.js";
import VolumeBar from "./canvas_components/primitives/volume_bar.js";
import VolumeBySideBar from "./canvas_components/primitives/volume_by_side_bar.js";
import Footprint from "./canvas_components/primitives/footprint";

const series = [
  new Indicator("Candlestick", [], Candlestick),
  new Indicator("Footprint", [], Footprint),
];

const indicators = [
  new Indicator("Volume", [], VolumeBar),
  new Indicator("Volume By Side", [], VolumeBySideBar),
];

export default { Indicator, series, indicators };
