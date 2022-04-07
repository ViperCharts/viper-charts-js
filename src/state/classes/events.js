import EventEmitter from "../../events/event_emitter";
import utils from "../../utils";

export default class EventsState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.keys = {};
    this.mousedown = false;
    this.keyBinds = {};
  }

  init() {
    this.mouseDownListener = this.onMouseDown.bind(this);
    window.addEventListener("mousedown", this.mouseDownListener);
    this.mouseUpListener = this.onMouseUp.bind(this);
    window.addEventListener("mouseup", this.mouseUpListener);
    this.mouseMoveListener = this.onMouseMove.bind(this);
    window.addEventListener("mousemove", this.mouseMoveListener);
    this.keyDownListener = this.onKeyDown.bind(this);
    window.addEventListener("keydown", this.keyDownListener);
    this.keyUpListener = this.onKeyUp.bind(this);
    window.addEventListener("keyup", this.keyUpListener);
    this.visibilitychangeListener = this.onVisibilityChange.bind(this);
    window.addEventListener("visibilitychange", this.visibilitychangeListener);
    this.contextMenuListener = this.onContextMenu.bind(this);
    this.$global.api.element.addEventListener(
      "contextmenu",
      this.contextMenuListener
    );
  }

  destroy() {
    window.removeEventListener("mousedown", this.mouseDownListener);
    window.removeEventListener("mouseup", this.mouseUpListener);
    window.removeEventListener("mousemove", this.mouseMoveListener);
    window.removeEventListener("keydown", this.keyDownListener);
    window.removeEventListener("keyup", this.keyUpListener);
    window.removeEventListener(
      "visibilitychange",
      this.visibilitychangeListener
    );
    this.$global.api.element.removeEventListener(
      "contextmenu",
      this.contextMenuListener
    );
  }

  onMouseDown(e) {
    this.mousedown = true;
    this.fireEvent("mousedown", e);
    const { app } = this.$global.ui;

    // If left click button, close context menu if open
    if (e.which === 1 && app.state.contextmenu.id !== "") {
      setTimeout(app.closeContextMenu.bind(app), 100);
    }
  }

  onMouseUp(e) {
    this.mousedown = false;
    this.fireEvent("mouseup", e);
  }

  onMouseMove(e) {
    this.fireEvent("mousemove", e);
  }

  addKeyBind(keys, callback) {
    const id = utils.uniqueId();
    this.keyBinds[id] = { keys, callback };
    return id;
  }

  onKeyDown({ key }) {
    this.keys[key] = true;
  }

  onKeyUp(e) {
    const { code, key } = e;

    this.keys[key] = false;

    if (code === "Delete") {
      this.$global.deleteSelectedChart();
    }

    this.fireEvent("keyup", e);
  }

  onVisibilityChange() {
    // Reset all down keys on change window to prevent de-synced state
    for (const key in this.keys) {
      this.keys[key] = false;
    }
  }

  onContextMenu(e) {
    e.preventDefault();
  }
}
