import Indicator from "../indicator.js";

export default class VolumeBar extends Indicator {
  constructor({ $state, datasetId }) {
    super({
      $state,
      datasetId,
      consumers: ["volume"],
    });

    this.screenHeightPerc = 0.2;
    this.upColor = "#C4FF4988";
    this.downColor = "#FE3A6488";

    this.init(this.draw.bind(this));
  }

  draw({ open, close, volume, plotVolume, plot }) {
    const isUp = close >= open;
    const color = isUp ? this.upColor : this.downColor;

    plotVolume({ volume, color });
  }
}
