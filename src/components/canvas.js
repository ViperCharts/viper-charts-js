import RenderingEngine from "./rendering_engine.js";

export default class Canvas {
  constructor({ $state, canvas, cursor = "default" }) {
    this.$state = $state;

    this.canvas = null;
    this.ctx = null;
    this.RE = null;
    this.cursor = cursor;

    this.isMouseDown = false;

    this.width = 0;
    this.height = 0;

    this.setCanvasElement(canvas);
    this.init();
  }

  init() {
    this.RE = new RenderingEngine(this);
  }

  setCanvasElement(canvas) {
    this.ctx = canvas.getContext("2d");

    canvas.style.cursor = this.cursor;
    canvas.width = canvas.clientWidth;
    this.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    this.height = canvas.clientHeight;

    canvas.addEventListener("mousedown", () => (this.isMouseDown = true));
    this.$state.global.events.addEventListener(
      "mouseup",
      () => (this.isMouseDown = false)
    );

    this.canvas = canvas;
  }

  /**
   *
   * @param {string} color Hex color
   * @param {number[]} coords Coordinates to draw at
   */
  drawBox(color, [x, y, w, h]) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x, y, w, h);
  }

  drawText(color, [x, y], text, options) {
    options = {
      textAlign: "center",
      ...options,
    };
    this.ctx.textAlign = options.textAlign;
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
    const w = this.$state.chart.pixelsPerElement * width;

    const x = this.$state.chart.getXCoordByTimestamp(coords[0]);
    const y1 = this.$state.chart.getYCoordByPrice(coords[1]);
    const y2 = this.$state.chart.getYCoordByPrice(coords[2]);

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
    const x1 = this.$state.chart.getXCoordByTimestamp(coords[0]);
    const y1 = this.$state.chart.getYCoordByPrice(coords[1]);
    this.ctx.moveTo(x1, y1);
    const x2 = this.$state.chart.getXCoordByTimestamp(coords[2]);
    const y2 = this.$state.chart.getYCoordByPrice(coords[3]);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
    this.ctx.closePath();
  }

  drawTextAtPriceAndTime(color, coords, text) {
    this.ctx.textAlign = "center";
    this.ctx.fillStyle = color;
    const x = this.$state.chart.getXCoordByTimestamp(coords[0]);
    this.ctx.fillText(text, x, coords[1]);
  }

  setWidth(width) {
    this.width = width;
    this.canvas.width = width;
    if (this.RE) this.RE.draw();
  }

  setHeight(height) {
    this.height = height;
    this.canvas.height = height;
    if (this.RE) this.RE.draw();
  }

  onMouseDown() {
    this.isMouseDown = true;
  }

  onMouseUp() {
    this.isMouseDown = false;
  }
}
