import instructions from "../models/instructions.js";
import Utils from "../utils.js";
import Helpers from "../workers/helpers.js";
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

    this.initDraw();
  }

  initDraw() {
    requestAnimationFrame(this.recursiveDraw.bind(this));
  }

  recursiveDraw() {
    this.draw();
    requestAnimationFrame(this.recursiveDraw.bind(this));
  }

  /**
   * Run draw canvas regardless of requesting animation frame or anything.
   * This can be used for when user interacts with the window like resizing
   */
  draw() {
    const instructions = this.$state.chart.instructions[this.type];
    const chartDimensions =
      this.$state.global.layout.chartDimensions[this.$state.chart.id];

    // Reset canvas
    this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.type === "yScale") {
      // Draw background
      this.canvas.drawBox("#080019", [
        0,
        0,
        chartDimensions.yScale.width,
        chartDimensions.yScale.height,
      ]);

      let maxWidth = 0;

      // Draw all scales
      for (const layerId in instructions.scales) {
        for (const item of instructions.scales[layerId]) {
          const { x, y, color, text } = item;
          this.canvas.drawText(color, [x, y], text);
        }
      }

      // Loop through all yScale plot instructions and measure the width of all texts and get max width
      for (const key in instructions.plots) {
        // If no instructions for set, continue
        if (!instructions.plots[key]) continue;
        const { layerId, values } = instructions.plots[key];
        if (!values || !values.length) continue;
        const [box, text] = values;
        const { ctx } = this.canvas;

        const textWidth = Math.ceil(ctx.measureText(text.text).width);
        if (textWidth > maxWidth) maxWidth = textWidth;

        // Draw the box and text
        this.canvas.drawBox(box.color, [box.x, box.y, box.w, box.h]);
        this.canvas.drawText(text.color, [text.x, text.y], text.text, {
          font: text.font,
        });
      }

      maxWidth = Math.max((maxWidth += 10), 50);

      // Check if maxWidth is not equal to current width of yScale
      const newScale = Math.floor(maxWidth / 5);
      const existingScale = Math.floor(chartDimensions.yScale.width / 5);
      if (newScale !== existingScale) {
        chartDimensions.setYScaleWidth(maxWidth);
        this.$state.chart.setVisibleRange({});
      }

      // Crosshair
      const p = this.$state.global.crosshair.price;
      const { y } =
        this.$state.global.crosshair.crosshairs[this.$state.chart.id];

      if (this.$state.global.crosshair.visible) {
        const { width } = chartDimensions.yScale;

        for (const id in y) {
          const { scaleType } = this.$state.chart.ranges.y[id];
          const text = Helpers.yScale.scales.scaleText(p, scaleType);

          this.canvas.drawBox("#424242", [0, y[id] - 10, width, 20]);
          this.canvas.drawText("#fff", [width / 2, y[id] + 3], text);
        }
      }

      // Border left, top, right
      const { width, layers } = chartDimensions.main;
      this.canvas.drawBox("#2E2E2E", [0, 0, width, 2]);

      // Border breakpoints / bottom
      for (const layerId in layers) {
        const { top, height } = layers[layerId];
        this.canvas.drawBox("#2E2E2E", [0, top + height - 2, width, 4]);
      }
    }

    if (this.type === "xScale") {
      // Draw background
      this.canvas.drawBox("#080019", [
        0,
        0,
        chartDimensions.xScale.width,
        chartDimensions.xScale.height,
      ]);

      // Draw all scales
      for (const { color, x, y, text } of instructions.scales) {
        this.canvas.drawText(color, [x, y], text);
      }

      // Crosshair
      const { crosshair } = this.$state.global;
      if (crosshair.visible) {
        const d = new Date(crosshair.timestamp);
        const dateText = `${
          d.getMonth() + 1
        }/${d.getDate()}/${d.getFullYear()} ${d.getHours()}:${`0${d.getMinutes()}`.slice(
          -2
        )}`;

        const { x } = crosshair.crosshairs[this.$state.chart.id];
        this.canvas.drawBox("#424242", [x - 45, 0, 90, 30]);
        this.canvas.drawText("#fff", [x, 15], dateText);
      }
    }

    if (this.type === "main") {
      // Cursor
      if (this.$state.global.events.mousedown) {
        this.canvas.setCursor("grabbing");
      } else if (this.$state.global.events.keys.Control) {
        this.canvas.setCursor("zoom-in");
      } else if (this.$state.global.events.keys.Shift) {
        this.canvas.setCursor("ns-resize");
      } else if (this.canvas.cursor !== "crosshair") {
        this.canvas.setCursor("crosshair");
      }

      // Draw background
      this.canvas.drawBox("#080019", [
        0,
        0,
        chartDimensions.main.width,
        chartDimensions.main.height,
      ]);

      // Draw grid
      (() => {
        const { height, width } = chartDimensions.main;
        const { xScale, yScale } = this.$state.chart.instructions;
        const color = "#43434377";

        for (const { x } of xScale.scales) {
          this.canvas.drawLine(color, [x, 0, x, height]);
        }

        for (const layerId in yScale.scales) {
          const values = yScale.scales[layerId];
          for (const { y } of values) {
            this.canvas.drawLine(color, [0, y, width, y]);
          }
        }
      })();

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

        // Else, maybe this is an indicator.
        if (!instructions.values[id]) continue;
        const { layerId, values } = instructions.values[id];
        if (!values) continue;

        const times = Object.keys(values);

        const parseInstruction = (a, i, j) => {
          if (a.type === "line") {
            if (i === undefined || j === undefined) return;
            let b = values[times[i + 1]];
            if (!b) return;
            b = b[j];
            this.canvas.drawLine(a.color, [a.x, a.y, b.x, b.y], a.linewidth);
          } else if (a.type === "box") {
            this.canvas.drawBox(a.color, [a.x, a.y, a.w, a.h]);
          } else if (a.type === "single-line") {
            this.canvas.drawLine(a.color, [a.x, a.y, a.x2, a.y2]);
          } else if (a.type === "text") {
            this.canvas.drawText(a.color, [a.x, a.y], a.text, { font: a.font });
          }
        };

        for (let i = 0; i < times.length; i++) {
          const instructionsForTime = values[times[i]];
          for (let j = 0; j < instructionsForTime.length; j++) {
            parseInstruction(instructionsForTime[j], i, j);
          }
        }
      }

      // Render all label plots
      for (const id of ids) {
        if (!instructions.plots[id]) continue;
        const { layerId, values } = instructions.plots[id];
        if (!values || !values.length) continue;
        const [box, text] = values;

        // Draw the box and text
        this.canvas.drawBox(box.color, [box.x, box.y, box.w, box.h]);
        this.canvas.drawText(text.color, [text.x, text.y], text.text, {
          font: text.font,
        });
      }

      // Check if in fullscreen
      const { y } = this.$state.chart.ranges;
      const found = Object.values(y).find(({ fullscreen }) => fullscreen);
      const borderColor = found ? "#0a6102" : "#2E2E2E";

      // Border left, top, right
      const { width, height, layers } = chartDimensions.main;
      this.canvas.drawBox(borderColor, [0, 0, 2, height]);
      this.canvas.drawBox(borderColor, [0, 0, width, 2]);
      this.canvas.drawBox(borderColor, [width - 2, 0, 2, height]);

      // Border breakpoints / bottom
      for (const layerId in layers) {
        const { top, height } = layers[layerId];
        this.canvas.drawBox(borderColor, [0, top + height - 2, width, 4]);
      }
    }
  }

  addToRenderingOrder(id, index = this.renderingOrder.length) {
    this.renderingOrder.join();
    this.renderingOrder.splice(index, 0, id);
  }

  removeFromRenderingOrder(id) {
    const i = this.renderingOrder.indexOf(id);
    delete instructions[id];
    this.renderingOrder.splice(i, 1);
  }

  adjustInstructions({ newRange, oldRange }) {
    const { width, height } = this.canvas;

    const newRangeWidth = newRange.end - newRange.start;
    const newRangeHeight = newRange.max - newRange.min;

    const leftOffset = oldRange.start - newRange.start;
    const rightOffset = oldRange.end - newRange.end;
    if (leftOffset !== rightOffset) {
    }

    // Calculate percentage difference between widths
    const x = -((newRange.start - oldRange.start) / newRangeWidth) * width;
    const y = ((newRange.min - oldRange.min) / newRangeHeight) * height;
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
