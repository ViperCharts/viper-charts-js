import RenderingEngine from "./rendering_engine.js";

import chartState from "../state/chart.js";

export default class Canvas {
  constructor({ id, height, width, cursor = "default", position }) {
    this.height = height;
    this.width = width;
    this.id = id;
    this.canvas = null;
    this.ctx = null;
    this.RE = null;
    this.sizing = {};
    this.cursor = cursor;

    this.isMouseDown = false;
    this.mouseDownListener = null;
    this.mouseUpListener = null;
    this.mouseMoveListener = null;
    this.count = 0;

    this.init({ position });
  }

  init({ position }) {
    this.canvas = document.createElement("canvas");
    this.canvas.id = this.id;
    this.ctx = this.canvas.getContext("2d");

    this.canvas.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.canvas.addEventListener("mouseup", this.onMouseUp.bind(this));
    this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
    this.canvas.style.cursor = this.cursor;
    this.canvas.style.position = "absolute";
    this.canvas.style[position] = "0px";

    this.setHeight(this.height);
    this.setWidth(this.width);

    chartState.chartParentElement.appendChild(this.canvas);
    chartState.setInitialVisibleRange(this.height, this.width);
    this.RE = new RenderingEngine(this);
  }

  /**
   *
   * @param {string} color Hex color
   * @param {number[]} coords Coordinates to draw at
   */
  drawBox(color, [x, y, w, h]) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(
      Math.floor(x),
      Math.floor(y),
      Math.round(w),
      Math.floor(h)
    );
  }

  drawText(color, [x, y], text) {
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = color;
    this.ctx.fillText(text, x, y);
  }

  /**
   * Draw a rectangle with 2 price coords and a width percentage of element / candle px width
   * @param {string} color Hex color
   * @param {number[]} coords Array of timestamp, top price, low price
   * @param {number} width Percentage of element width to cover
   */
  drawBoxByPriceAndPercWidthOfTime(color, coords, width) {
    // Get percentage of element width
    const w = chartState.pixelsPerElement * width;

    const x = chartState.getXCoordByTimestamp(coords[0]);
    const y1 = chartState.getYCoordByPrice(coords[1]);
    const y2 = chartState.getYCoordByPrice(coords[2]);

    const h = y2 - y1;

    if (h >= 0)
      this.drawBox(color, [x - w / 2, y1, Math.max(w, 1), Math.max(h, 1)]);
    else this.drawBox(color, [x - w / 2, y1, Math.max(w, 1), Math.min(h, 1)]);
  }

  /**
   * Draw line between 2 points using canvas pixel coords
   * @param {string} color Hex color
   * @param {number[]} coords Coordinates to draw line from and to
   */
  drawLine(color, coords) {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    this.ctx.moveTo(Math.floor(coords[0]), Math.floor(coords[1]));
    this.ctx.lineTo(Math.floor(coords[2]), Math.floor(coords[3]));
    this.ctx.stroke();
    this.ctx.closePath();
  }

  /**
   * Draw line between 2 points using price and time coords
   * @param {string} color Hex color
   * @param {number[]} coords Time and price coordinates to draw line from and to
   */
  drawLineByPriceAndTime(color, coords) {
    this.ctx.strokeStyle = color;
    this.ctx.beginPath();
    const x1 = chartState.getXCoordByTimestamp(coords[0]);
    const y1 = chartState.getYCoordByPrice(coords[1]);
    this.ctx.moveTo(x1, y1);
    const x2 = chartState.getXCoordByTimestamp(coords[2]);
    const y2 = chartState.getYCoordByPrice(coords[3]);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.closePath();
  }

  drawTextAtPriceAndTime(color, coords, text) {
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = color;
    const x = chartState.getXCoordByTimestamp(coords[0]);
    this.ctx.fillText(text, x, coords[1]);
  }

  setWidth(width) {
    this.width = width;
    this.canvas.width = width;
    this.canvas.style.width = width;
    if (this.RE) this.RE.draw();
  }

  setHeight(height) {
    this.height = height;
    this.canvas.height = height;
    this.canvas.style.height = height;
    if (this.RE) this.RE.draw();
  }

  onMouseDown() {
    this.isMouseDown = true;
  }

  onMouseUp() {
    this.isMouseDown = false;
  }

  onMouseMove(e) {
    if (this.isMouseDown) {
      chartState.handleMouseRangeChange(e.movementX, e.movementY);
    }
  }
}
