export default {
  getChartSettings() {
    return JSON.parse(localStorage.getItem("chart-settings") || "{}");
  },

  setChartSettings(settings) {
    console.log(settings);
    localStorage.setItem("chart-settings", JSON.stringify(settings));
  },
};
