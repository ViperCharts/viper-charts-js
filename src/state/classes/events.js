import EventEmitter from "../../events/event_emitter";

export default class EventsState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;
  }

  init() {
    this.mouseDownListener = this.onMouseDown.bind(this);
    window.addEventListener("mousedown", this.mouseDownListener);
    this.mouseUpListener = this.onMouseUp.bind(this);
    window.addEventListener("mouseup", this.mouseUpListener);
    this.mouseMoveListener = this.onMouseMove.bind(this);
    window.addEventListener("mousemove", this.mouseMoveListener);
    this.keyUpListener = this.onKeyUp.bind(this);
    window.addEventListener("keyup", this.keyUpListener);
    this.contextMenuListener = this.onContextMenu.bind(this);
    document
      .getElementById("app")
      .addEventListener("contextmenu", this.contextMenuListener);
  }

  destroy() {
    window.removeEventListener("mousedown", this.mouseDownListener);
    window.removeEventListener("mouseup", this.mouseUpListener);
    window.removeEventListener("mousemove", this.mouseMoveListener);
    window.removeEventListener("keyup", this.keyUpListener);
    document
      .getElementById("app")
      .removeEventListener("contextmenu", this.contextMenuListener);
  }

  onMouseDown(e) {
    this.fireEvent("mousedown", e);
    const { app } = this.$global.ui;

    // If left click button, close context menu if open
    if (e.which === 1 && app.state.contextmenu.id !== "") {
      setTimeout(app.closeContextMenu.bind(app), 100);
    }
  }

  onMouseUp(e) {
    this.fireEvent("mouseup", e);
  }

  onMouseMove(e) {
    this.fireEvent("mousemove", e);
  }

  onKeyUp(e) {
    const { code } = e;

    // if (code === "Delete" || code === "Backspace") {
    if (code === "Delete") {
      this.$global.deleteSelectedChart();
    }

    this.fireEvent("keyup", e);
  }

  onContextMenu(e) {
    e.preventDefault();
    let { context_menu_id, context_menu_data } = e.path[0].attributes;
    if (!context_menu_id) return;

    if (context_menu_data) {
      context_menu_data = JSON.parse(context_menu_data.value);
    }

    const { clientX: x, clientY: y } = e;
    this.$global.ui.app.setContextMenu(
      context_menu_id.value,
      [x, y],
      context_menu_data
    );
  }
}
