import "./style.css";
import { v } from "ironjs";
import Chart from "./chart/chart.js";
import data from "./data.js";

new Chart({
  data,
  element: document.querySelector("#app"),
});
