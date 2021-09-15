import chartState from "../../state/chart.js";
import layoutState from "../../state/layout.js";

import Canvas from "../canvas.js";
import Background from "./background.js";
import Layer from "./layer.js";
import PriceSelected from "./price_selected.js";

export default class TimeScale {
  constructor() {
    this.canvas = new Canvas({
      id: `canvas-pricescale`,
      height: layoutState.height.height - 20,
      width: 50,
      cursor: "n-resize",
      position: "right",
    });
    this.background = new Background({
      canvas: this.canvas,
      color: "#080019",
    });
    this.priceSelected = new PriceSelected({ canvas: this.canvas });

    this.init();
  }

  init() {
    layoutState.height.addEventListener("setHeight", (height) =>
      this.canvas.setHeight(height - 20)
    );
  }
}

// class TimeScaleLayer extends Layer {
//   constructor({ canvas }) {
//     super(canvas);

//     this.renderingQueueId = this.canvas.RE.addToQueue(this.draw.bind(this));
//   }

//   /**
//    * Draw canvas function, this is a placeholder
//    */
//   draw() {
//     for (const time of chartState.visibleScales.x) {
//       const d = new Date(time);
//       this.canvas.drawTextAtPriceAndTime(
//         "#A7A8B3",
//         [time, 15],
//         "" + `${d.getHours()}:${`0${d.getMinutes()}`.slice(-2)}`
//       );
//     }
//   }
// }
