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
  constructor({ canvas, $state, type, settings }) {
    this.$state = $state;

    this.canvas = canvas;
    this.type = type;

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
    // Reset canvas
    this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    const ids = [...this.renderingOrder];

    const allInstructions =
      this.$state.chart.computedData.instructions[this.type];

    // If no instructions
    if (!allInstructions || typeof allInstructions !== "object") {
      return;
    }

    // Loop through all rendering ids
    for (const id of ids) {
      let item = this.overlayQueue.get(id);

      // If overlay and not indicator
      if (item) {
        const { overlay } = item;
        overlay.drawFunc.bind(overlay)();
        continue;
      }

      // Else, is this an indicator?
      const instructions = allInstructions[id];

      // If no instructions
      if (!instructions || typeof instructions !== "object") {
        continue;
      }

      const times = Object.keys(instructions);

      const parseInstruction = (a, i, j) => {
        const { offsetX, offsetY, offsetW, offsetH } =
          this.$state.chart.computedData;

        if (a.type === "line") {
          if (i === undefined || j === undefined) return;
          let b = instructions[times[i + 1]];
          if (!b) return;
          b = b[j];
          this.canvas.drawLine(
            a.color,
            [a.x + offsetX, a.y + offsetY, b.x + offsetX, b.y + offsetY],
            a.linewidth
          );
        } else if (a.type === "box") {
          this.canvas.drawBox(a.color, [
            a.x + offsetX,
            a.y + offsetY,
            a.w,
            a.h,
          ]);
        } else if (a.type === "single-line") {
          this.canvas.drawLine(a.color, [
            a.x + offsetX,
            a.y + offsetY,
            a.x2 + offsetX,
            a.y2 + offsetY,
          ]);
        } else if (a.type === "text") {
          this.canvas.drawText(
            a.color,
            [a.x + offsetX, a.y + offsetY],
            a.text,
            { font: a.font }
          );
        }
      };

      if (this.type === "main") {
        for (let i = 0; i < times.length; i++) {
          const instructionsForTime = instructions[times[i]];
          for (let j = 0; j < instructionsForTime.length; j++) {
            parseInstruction(instructionsForTime[j], i, j);
          }
        }
      } else {
        parseInstruction(allInstructions[id]);
      }
    }
  }

  addToRenderingOrder(id, index = this.renderingOrder.length) {
    this.renderingOrder.join();
    this.renderingOrder.splice(index, 0, id);
  }

  removeFromRenderingOrder(id) {
    const i = this.renderingOrder.indexOf(id);
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
