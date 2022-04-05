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
    const { indicator, pendingRequests } = this.props;
    const v = indicator.visible;

    const mo = this.state.isMouseOver;

    return (
      <div
        onMouseOver={() => this.setState({ isMouseOver: true })}
        onMouseOut={() => this.setState({ isMouseOver: false })}
        onContextMenu={(e) =>
          this.$global.ui.app.setContextMenu(e, "indicator", {
            chart: this.chart,
            indicator,
          })
        }
        className={`indicator v-noselect ${v ? "" : "invisible"}`}
      >
        <span className="indicator-model">{indicator.model.name}</span>
        <span className="indicator-name">{indicator.name}</span>
        {pendingRequests > 0 ? (
          <div className="indicator-loading">
            <svg
              version="1.1"
              id="L4"
              xmlns="http://www.w3.org/2000/svg"
              x="0px"
              y="0px"
              height="24px"
              width="24px"
              viewBox="0 0 100 100"
              enableBackground="new 0 0 0 0"
            >
              <circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
                <animate
                  attributeName="opacity"
                  dur="1s"
                  values="0;1;0"
                  repeatCount="indefinite"
                  begin="0.1"
                />
              </circle>
              <circle fill="#fff" stroke="none" cx="26" cy="50" r="6">
                <animate
                  attributeName="opacity"
                  dur="1s"
                  values="0;1;0"
                  repeatCount="indefinite"
                  begin="0.2"
                />
              </circle>
              <circle fill="#fff" stroke="none" cx="46" cy="50" r="6">
                <animate
                  attributeName="opacity"
                  dur="1s"
                  values="0;1;0"
                  repeatCount="indefinite"
                  begin="0.3"
                />
              </circle>
            </svg>
          </div>
        ) : null}

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
