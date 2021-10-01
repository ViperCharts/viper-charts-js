import React from "react";
import ReactDOM from "react-dom";

import GlobalState from "../../state/global";

import Modal from "../../react-components/modal/modal";
import Chart from "../../react-components/chart/chart";
import TopBar from "../../react-components/top-bar/top-bar";

import "../../../node_modules/react-grid-layout/css/styles.css";
import "../../../node_modules/react-resizable/css/styles.css";

import GridLayout from "react-grid-layout";

class MyFirstGrid extends React.Component {
  render() {
    // layout is an array of objects, see the demo for more complete usage
    const layout = [
      { i: "a", x: 0, y: 0, w: 1, h: 2, static: true },
      { i: "b", x: 1, y: 0, w: 3, h: 2, minW: 2, maxW: 4 },
      { i: "c", x: 4, y: 0, w: 1, h: 2 },
    ];
    return (
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={30}
        width={1200}
      >
        <div key="a">a</div>
        <div key="b">b</div>
        <div key="c">c</div>
      </GridLayout>
    );
  }
}
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
          {this.renderCharts()}
          <MyFirstGrid />
        </div>
      </div>
    );
  }

  renderCharts() {
    const keys = Object.keys(this.state.charts);
    if (!keys.length) return <div></div>;
    const charts = keys.map((key) => <Chart id={key} key={key} />);
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
