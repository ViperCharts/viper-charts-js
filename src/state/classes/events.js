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

  onKeyDown({ key, which }) {
    this.keys[key] = true;

    // If keyboard key down to type
    if (!this.keys.Control && !this.keys.Alt) {
      if (which >= 65 && which <= 90 && /[a-z]/.test(key)) {
        const chart = this.$global.charts[this.$global.selectedChartId];

        // Show change dataset group modal
        if (chart.selectedDatasetGroup) {
          this.$global.ui.app.setModal("change-dataset", {
            datasetGroupId: chart.selectedDatasetGroup,
            search: key,
          });
        }

        // If no dataset group, show create dataset group modal
        else {
          this.$global.ui.app.setModal("dataset-group", { search: key });
        }
      }

      if (key === "/") {
        const chart = this.$global.charts[this.$global.selectedChartId];

        // Show add indicator modal if dataset group present
        if (chart.selectedDatasetGroup) {
          this.$global.ui.app.setModal("indicators", {
            datasetGroupId: chart.selectedDatasetGroup,
          });
        }
      }
    }

    if (key === "Escape") {
      this.$global.ui.app.setModal("");
    }

    if (this.keys.Shift && which >= 49 && which <= 57) {
      const i = which - 49;
      const chart = this.$global.charts[this.$global.selectedChartId];

      const groupIds = Object.keys(chart.datasetGroups);
      const datasetGroupId = groupIds[i];

      // If found a dataset group
      if (datasetGroupId !== undefined) {
        chart.setSelectedDatasetGroup(datasetGroupId);
      } else {
        this.$global.ui.app.setModal("dataset-group", { search: "" });
      }
    }
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
