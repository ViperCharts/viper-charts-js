import EventEmitter from "../../events/event_emitter.ts";
import Utils from "../../utils";

import ScriptFunctions from "../../viper_script/script_functions";

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

    this.queue = new Map();
    this.sets = {};
    this.instructions = {};
  }

  calculateAllSets() {
    let iteratedKey = "";
    let iteratedTime = 0;
    this.sets = {};

    const funcWraps = {};
    for (const funcName in ScriptFunctions) {
      funcWraps[funcName] = function () {
        ScriptFunctions[funcName](...arguments, {
          renderingQueueId: iteratedKey,
          chartId: this.$parent.id,
          time: iteratedTime,
        });
      }.bind(this);
    }

    // Loop through each indicator that is multi, and build sets for it
    for (iteratedKey of Array.from(this.queue.keys())) {
      const item = this.queue.get(iteratedKey);
      const { indicator, visible } = item;

      if (!visible) continue;

      // Loop through each visible item of dataset indicator is subscribed to
      const visibleData = this.$parent.visibleData[indicator.datasetId];

      // Run the indicator function for this candle and get all results
      for (const point of visibleData.data) {
        iteratedTime = point.time;

        indicator.drawFunc.bind(indicator)({
          ...point,
          ...funcWraps,
        });
      }
    }

    this.generateInstructions();
  }

  addToQueue(indicator, index) {
    let id = Utils.uniqueId();
    do {
      id = Utils.uniqueId();
    } while (this.queue.has(id));

    this.queue.set(id, {
      indicator,
      visible: true,
    });

    const { canvas } = this.$parent.subcharts.main;
    canvas.RE.addToRenderingOrder(id);

    return id;
  }

  toggleVisibility(id) {
    if (!this.queue.has(id)) {
      console.error(`${id} was not found in rendering queue`);
      return;
    }

    const item = this.queue.get(id);
    item.visible = !item.visible;
    this.queue.set(id, item);
  }

  removeFromQueue(id) {
    if (!this.queue.has(id)) {
      console.error(`${id} was not found in rendering queue`);
      return false;
    }

    const { canvas } = this.$parent.subcharts.main;
    canvas.RE.removeFromRenderingOrder(id);
    this.queue.delete(id);

    return true;
  }

  addSetItem(id, time, type, values) {
    if (!this.sets[id]) {
      this.sets[id] = new ComputedSet();
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
          const { series } = values;

          if (type === "line") {
            instructions[id][time].push({
              type: "line",
              x,
              y: chart.getYCoordByPrice(series[0]),
            });
          }

          if (type === "box") {
            const y1 = chart.getYCoordByPrice(series[0]);
            const y2 = chart.getYCoordByPrice(series[1]);
            const w = chart.pixelsPerElement * series[3];
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
