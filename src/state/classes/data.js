import EventEmitter from "../../events/event_emitter.ts";

class Dataset extends EventEmitter {
  constructor(id, name, data) {
    super();
    this.id = id;
    this.name = name;
    this.data = data;
  }

  /**
   * Update the data and call all subscribers that updates were applied
   * @param {array} updates
   */
  updateData(updates) {
    // TODO
  }
}

export default class LayoutState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.datasets = new Map();
  }

  init() {}

  addDataset(id, name, data) {
    const dataset = new Dataset(id, name, data);
    this.datasets.set(dataset.id, dataset);
    this.fireEvent("add-dataset", dataset);
  }
}
