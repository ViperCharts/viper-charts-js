let id = "";

import Methods from "./methods";

self.addEventListener("message", (e) => {
  const { type, data } = e.data;

  switch (type) {
    case "id":
      id = data;
      break;
    case "method":
      // Run appropriate method
      const { queueId, method, params } = data;
      console.log(method, params);
      postMessage({ type: "finished", id, queueId, res });
      break;
    default:
      console.error(`No implementation for type: ${type}`);
      break;
  }
});
