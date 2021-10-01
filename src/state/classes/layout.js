import EventEmitter from "../../events/event_emitter.ts";

export default class LayoutState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.height = 0;
    this.width = 0;
    this.chartDimensions = {};
  }

  init() {
    window.addEventListener("resize", this.resize.bind(this));
    setTimeout(this.resize.bind(this));
  }

  resize() {
    const { current } = this.$global.ui.app.chartsElement;

    this.height = current.clientHeight;
    this.width = current.clientWidth;

    this.fireEvent("resize", {
      height: this.height,
      width: this.width,
    });
  }
}
