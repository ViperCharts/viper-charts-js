import EventEmitter from "../../events/event_emitter";

export default class SettingsState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.chart = {};
  }

  init() {}
}
