import React from "react";
import ReactDOM from "react-dom";

import GlobalState from "../../state/global";

import Modal from "../../react-components/modal/modal";
import Chart from "../../react-components/chart/chart";
import TopBar from "../../react-components/top-bar/top-bar";

import "../../../node_modules/react-grid-layout/css/styles.css";
import "../../../node_modules/react-resizable/css/styles.css";

import GridLayout from "react-grid-layout";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      charts: {},
      modal: "",
    };

    this.appElement = React.createRef();
    this.chartsElement = React.createRef();
  }

  addChart(chart) {
    const charts = this.state.charts;
    charts[chart.id] = chart;
    this.setState(() => (this.state.charts = charts), chart.init.bind(chart));
  }

  setModal(modal) {
    this.setState(() => (this.state.modal = modal));
  }

  render() {
    const { modal } = this.state;

    return (
      <div
        ref={this.appElement}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <link
          href="https://cdn.jsdelivr.net/npm/css.gg/icons/all.css"
          rel="stylesheet"
        />

        {modal.length ? <Modal id={modal} /> : null}

        <TopBar />
        <div ref={this.chartsElement} style={{ width: "100%", height: "100%" }}>
          <GridLayout
            className="layout"
            cols={12}
            rowHeight={300}
            width={1200}
            resizeHandles={["se", "s"]}
            margin={[0, 0]}
          >
            {this.renderCharts()}
          </GridLayout>
        </div>
      </div>
    );
  }

  renderCharts() {
    const keys = Object.keys(this.state.charts);
    if (!keys.length) return <div></div>;
    console.log(keys);
    const charts = keys.map((key) => (
      <div
        key={key}
        data-grid={{
          x: 0,
          y: 0,
          w: 12,
          h: 2,
        }}
      >
        <Chart id={key} style={{ width: "100%", height: "100%" }} />
      </div>
    ));
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
