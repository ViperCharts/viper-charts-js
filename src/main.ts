import "./style.css";
import Chart from "./chart/chart.js";
import data from "./min5.json";

console.log(data.length);

const newData = data.map((c: any) => ({
  time: new Date(c.Time).getTime(),
  low: c.Low,
  high: c.High,
  open: c.Open,
  close: c.Close,
  volume: c.Volume,
}));

new Chart({
  data: newData.reverse(),
  element: document.querySelector("#app"),
});
