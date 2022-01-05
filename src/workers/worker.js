import ComputedData from "./computed_data";

let id = "";

const computedStates = {};

self.addEventListener("message", (e) => {
  const { type, data } = e.data;

  switch (type) {
    case "id":
      id = data;
      break;
    case "addComputedState":
      computedStates[data.chartId] = new ComputedData();
      break;
    case "runComputedStateMethod":
      const res = computedStates[data.chartId][data.method](data.params);
      if (data.resolveId) {
        postMessage({
          type: "resolve",
          chartId: data.chartId,
          resolveId: data.resolveId,
          res,
        });
      }
      break;
    case "deleteComputedState":
      delete computedStates[data.chartId];
      break;
    default:
      console.error(`No implementation for type: ${type}`);
      break;
  }
});
