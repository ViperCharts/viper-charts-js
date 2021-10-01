import React from "react";

import GlobalState from "../../state/global";

import "./top-bar.css";

export default class TopBar extends React.Component {
  constructor(props) {
    super(props);
  }

  showIndicatorsModal() {
    GlobalState.ui.app.setModal("indicators");
  }

  addChart() {
    const chart = GlobalState.createChart.bind(GlobalState)();
  }

  render() {
    return (
      <div className="top-bar">
        <button className="top-bar-item">🐍</button>
        <button onClick={this.showIndicatorsModal} className="top-bar-item">
          Indicators
        </button>
        <button onClick={this.addChart} className="top-bar-item">
          <i className="gg-add"></i>
          Chart
        </button>
      </div>
    );
  }
}
