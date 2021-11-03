import Utils from "../utils.js";
import Canvas from "./canvas.js";

/**
 * Handles render queue and layers including order
 */
export default class RenderingEngine {
  /**
   * @param {Canvas} canvas
   * @param {object} settings
   */
  constructor({ canvas, $state, settings }) {
    this.$state = $state;

    this.canvas = canvas;

    this.overlayQueue = new Map();
    /**
     * Rendering order of queue Map IDs (first rendered in back, last rendered in front)
     * @type {Array<string>} id
     */
    this.renderingOrder = [];
    this.lastFrameTime = -1;

    this.initDraw();
  }

  initDraw() {
    requestAnimationFrame(this.recursiveDraw.bind(this));
  }

  recursiveDraw() {
    const t0 = this.lastFrameTime;
    const t1 = performance.now();
    const fps = Math.floor(t0 < 0 ? 0 : 1000 / (t1 - t0));
    this.lastFrameTime = t1;
    this.draw();
    requestAnimationFrame(this.recursiveDraw.bind(this));
  }

  /**
   * Run draw canvas regardless of requesting animation frame or anything.
   * This can be used for when user interacts with the window like resizing
   */
  draw() {
    const { computedData } = this.$state.chart;

    // Reset canvas
    this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const ids = [...this.renderingOrder];

    // Loop through all rendering ids
    for (const id of ids) {
      let item = this.overlayQueue.get(id);

      // If overlay and not indicator
      if (item) {
        const { overlay } = item;
        overlay.drawFunc.bind(overlay)();
        continue;
      }

      const instructions = computedData.instructions[id];

      // Else, indicator, loop through all instructions and their plot points
      const times = Object.keys(instructions);
      for (let i = 0; i < times.length; i++) {
        const instructionsForTime = instructions[times[i]];

        for (let j = 0; j < instructionsForTime.length; j++) {
          const a = instructionsForTime[j];

          if (a.type === "line") {
            let b = instructions[times[i + 1]];
            if (!b) continue;
            b = b[j];
            this.canvas.drawLine(a.color, [a.x, a.y, b.x, b.y]);
          }

          if (a.type === "box") {
            this.canvas.drawBox(a.color, [a.x, a.y, a.w, a.h]);
          }

          if (a.type === "single-line") {
            this.canvas.drawLine(a.color, [a.x, a.y, a.x2, a.y2]);
          }
        }
      }
    }
  }

  addToRenderingOrder(id) {
    this.renderingOrder.push(id);
  }

  removeFromRenderingOrder(id) {
    const i = this.renderingOrder.indexOf(id);
    if (i < 0) {
      console.error(`${id} was not found in rendering order`);
      return false;
    }

    this.renderingOrder.splice(i, 1);
  }

  addOverlay(overlay) {
    let id = Utils.uniqueId();
    do {
      id = Utils.uniqueId();
    } while (this.renderingOrder.includes(id));

    this.overlayQueue.set(id, {
      overlay,
      visible: true,
    });

    this.addToRenderingOrder(id);

    return id;
  }
}
