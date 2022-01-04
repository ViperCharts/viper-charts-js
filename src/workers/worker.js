import ComputedData from "./computed_data";

let id = "";

const computedStates = {};

self.addEventListener("message", (e) => {
  const { type, data } = e.data;

  console.log(e.data);

  switch (type) {
    case "id":
      id = data;
      break;
    case "addComputedState":
      this.computedStates[data.chartId] = new ComputedData();
      break;
    case "runComputedStateMethod":
      this.computedStates[data.chartId][data.method](...data.params);
      break;
    case "deleteComputedState":
      delete computedStates[data.chartId];
      break;
    case "method":
      // Run appropriate method
      const { queueId } = data;
      const res = Methods[data.method](data.params);
      postMessage({ type: "finished", id, queueId, res });

      break;
    default:
      console.error(`No implementation for type: ${type}`);
      break;
  }
});
