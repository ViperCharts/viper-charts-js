import React from "react";

import GlobalState from "../../../state/global";

import "./indicator.css";

export default class Indicator extends React.Component {
  constructor(props) {
    super(props);

    this.chart = GlobalState.charts[props.chartId];
  }

  toggleVisibility() {
    this.chart.toggleVisibility(this.props.renderingQueueId);
  }

  remove() {
    this.chart.removeIndicator(this.props.renderingQueueId);
  }

  render() {
    const { indicator } = this.props;
    const v = indicator.visible;
    const dataset = this.chart.datasets[indicator.datasetId];

    return (
      <div className={`indicator v-noselect ${v ? "" : "invisible"}`}>
        <span className="indicator-title">
          <div className="indicator-subtitle">
            {`${dataset.source} ${dataset.name}`}
          </div>
          {indicator.name}
        </span>
        <button onClick={this.toggleVisibility.bind(this)}>
          {v ? <i className="gg-eye"></i> : <i className="gg-eye-alt"></i>}
        </button>
        <button onClick={this.remove.bind(this)}>
          <i className="gg-close"></i>
        </button>
      </div>
    );
  }
}
