import EventEmitter from "../../events/event_emitter.ts";

class ComputedSet {
  constructor() {
    this.data = {};
    this.max = 0;
    this.min = Infinity;
  }
}

export default class ComputedData extends EventEmitter {
  constructor({ $global, $parent }) {
    super();

    this.$global = $global;
    this.$parent = $parent;

    this.sets = {};
    this.instructions = {};
  }

  calculateAllSets() {
    // Loop through each indicator that is multi, and build sets for it
  }

  addSetItem(id, time, type, values) {
    if (!this.sets[id]) {
      this.sets[id] = new Set();
    }

    const set = this.sets[id];
    if (!set.data[time]) set.data[time] = [{ type, values }];
    else set.data[time].push({ type, values });

    // Update max & min if applicable
    for (const key in values) {
      if (values[key] < set.min) {
        set.min = values[key];
      } else if (values[key] > set.max) {
        set.max = values[key];
      }
    }
  }

  generateInstructions() {
    const { canvas } = this.$parent;
    const chart = this.$parent;
    const instructions = {};

    for (const id in this.sets) {
      const set = this.sets[id];
      const { data } = set;

      instructions[id] = {};

      for (const time in data) {
        const item = data[time];

        instructions[id][time] = [];

        const x = chart.getXCoordByTimestamp(time);

        // Loop through all instructions for this time
        for (let i = 0; i < item.length; i++) {
          const { type, values } = item[i];

          if (type === "line") {
            instructions[id][time].push({
              type: "line",
              x,
              y: chart.getYCoordByPrice(values[0]),
            });
          }

          if (type === "box") {
            const y1 = chart.getYCoordByPrice(values[0]);
            const y2 = chart.getYCoordByPrice(values[1]);
            const w = chart.pixelsPerElement * values[3];
            // const height = y2 - y1;

            instructions[id][time].push({
              type: "box",
              x: x - w / 2,
              y: y1,
              w: w,
              h: Math.abs(y2) - Math.abs(y1),
            });
          }
        }
      }
    }

    this.instructions = instructions;
  }
}
