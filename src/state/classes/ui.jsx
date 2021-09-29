import React from "react";
import ReactDOM from "react-dom";

import GlobalState from "../../state/global";

import Chart from "../../react-components/chart/chart.jsx";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      charts: {},
    };
  }

  addChart(chart) {
    const charts = this.state.charts;
    charts[chart.id] = chart;
    this.setState(() => (this.state.charts = charts));
  }

  render() {
    return (
      <div style={{ width: "100%", height: "100%" }}>
        <link
          href="https://cdn.jsdelivr.net/npm/css.gg/icons/all.css"
          rel="stylesheet"
        />

        <div style={{ width: "100%", height: "100%" }}>
          {this.renderCharts()}
        </div>
      </div>
    );
  }

  renderCharts() {
    const keys = Object.keys(this.state.charts);
    if (!keys.length) return <div></div>;
    const charts = keys.map((key) => <Chart id={key} key={key} />);
    console.log(charts);
    return charts;
  }
}

export default class UIState {
  constructor({ $global }) {
    this.$global = $global;

    this.app = undefined;
    this.charts = {};
  }

  init() {
    this.app = ReactDOM.render(<App />, document.getElementById("app"));
  }
}
