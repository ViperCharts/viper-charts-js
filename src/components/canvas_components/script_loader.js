import Layer from "./layer";
import chartState from "../../state/chart.js";

export default class ScriptLoader extends Layer {
  constructor({ canvas, func }) {
    super(canvas);
    this.func = func;
  }

  draw() {}
}
