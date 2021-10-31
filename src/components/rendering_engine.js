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
    /**
     * Instructions map for canvas drawings
     * @type {Map<string,Layer>}
     */
    this.queue = new Map();
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

    const keys = [...this.renderingOrder];

    // Loop through all rendering keys
    for (let i = 0; i < keys.length; ) {
      const key = keys[i];
      const item = this.queue.get(key);

      if (!item.visible) {
        i++;
        continue;
      }

      const { layer } = item;
      const draw = layer.drawFunc.bind(layer);

      if (layer.type === "single") {
        keys.splice(i, 1);
        draw();
        continue;
      }

      if (layer.type === "multi") {
        // Loop through all visible data of type
        const visibleData = this.$state.chart.visibleData[layer.datasetId];
        for (const data of visibleData.data) {
          draw(data);
        }
      }

      i++;
    }
  }

  /**
   * Add a canvas layer drawing function to the queue
   * @param {Layer} layer
   */
  addToQueue(layer, index) {
    // Generate a key that is not yet used
    let id = Utils.uniqueId();
    do {
      id = Utils.uniqueId();
    } while (this.queue.has(id));

    // Add to the queue
    this.queue.set(id, {
      layer,
      visible: true,
    });
    this.renderingOrder.push(id);

    return id;
  }

  toggleVisibility(id) {
    if (!this.queue.has(id)) {
      console.error(`${id} was not found in rendering queue`);
      return;
    }

    const item = this.queue.get(id);
    item.visible = !item.visible;
    this.queue.set(id, item);
  }

  removeFromQueue(id) {
    if (!this.queue.has(id)) {
      console.error(`${id} was not found in rendering queue`);
      return false;
    }

    const i = this.renderingOrder.indexOf(id);
    if (i < 0) {
      console.error(`${id} was not found in rendering order`);
      return false;
    }

    this.renderingOrder.splice(i, 1);
    this.queue.delete(id);

    return true;
  }
}
