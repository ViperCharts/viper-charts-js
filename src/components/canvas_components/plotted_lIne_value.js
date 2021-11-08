import Overlay from "./overlay.js";

export default class PlottedLineValues extends Overlay {
  constructor({ $state, canvas }) {
    super({ $state, canvas });

    this.$state = $state;
    this.canvas = canvas;

    this.color = "#080019";

    this.init(this.draw.bind(this));
  }

  draw() {
    // Loop through every instruction
    //   const { instructions } = this.$state.chart.computedData;
    //   const times = Object.keys(instructions);
    //   const lastInstructions = instructions[times[times.length - 1]];
    //   for (const instruction of lastInstructions) {
    //     if (instruction.ylabel === false) continue;
    //     const p
    //     const y =
    //     this.canvas.drawBox("#424242", [0, y - 10, 50, 20]);
    //     this.canvas.drawText("#fff", [25, y + 3], p);
    //   }
  }
}
