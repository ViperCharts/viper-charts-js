class Indicator {
  constructor(name, dataSources, c) {
    this.id = name.replaceAll(" ", "-").toLowerCase();
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
  // new Indicator("Footprint", [], Footprint),
  new Indicator("Price Line", [], PriceLine),
];

import VolumeBar from "./canvas_components/primitives/volume_bar.js";
import VolumeBySideBar from "./canvas_components/primitives/volume_by_side_bar.js";
import SMA from "./canvas_components/primitives/sma";
import MASlope from "./canvas_components/primitives/ma_slope";

export const indicators = [
  new Indicator("Volume", [], VolumeBar),
  // new Indicator("Volume By Side", [], VolumeBySideBar),
  new Indicator("MA Slope", [], MASlope),
  new Indicator("SMA", [], SMA),
];

export const map = (() => {
  const map = new Map();

  for (const indi of [...series, ...indicators]) {
    if (map.has(indi.id)) {
      console.error("Duplicate indicator ID detected for: " + indi.name);
      return;
    }
    map.set(indi.id, indi);
  }

  return map;
})();

export default { series, indicators, map };
