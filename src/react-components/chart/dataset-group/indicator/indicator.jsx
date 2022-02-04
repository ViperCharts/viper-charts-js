import React from "react";

import "./indicator.css";

export default class Indicator extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.chart = this.$global.charts[props.chartId];

    this.state = {
      isMouseOver: false,
    };
  }

  toggleVisibility() {
    this.chart.toggleIndicatorVisibility(
      this.props.datasetGroupId,
      this.props.renderingQueueId
    );
  }

  remove() {
    this.chart.removeIndicator(
      this.props.datasetGroupId,
      this.props.renderingQueueId
    );
  }

  render() {
    const { indicator } = this.props;
    const v = indicator.visible;

    const mo = this.state.isMouseOver;

    return (
      <div
        onMouseOver={() => this.setState({ isMouseOver: true })}
        onMouseOut={() => this.setState({ isMouseOver: false })}
        className={`indicator v-noselect ${v ? "" : "invisible"}`}
      >
        <span className="indicator-title">{indicator.name}</span>

        <div
          className="indicator-controls"
          style={{ visibility: mo ? "visible" : "hidden" }}
        >
          <button onClick={this.toggleVisibility.bind(this)}>
            {v ? <i className="gg-eye"></i> : <i className="gg-eye-alt"></i>}
          </button>
          <button onClick={this.remove.bind(this)}>
            <i className="gg-close"></i>
          </button>
        </div>
      </div>
    );
  }
}
