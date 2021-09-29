import React from "react";

import GlobalState from "../../state/global";

import Indicator from "./indicator/indicator";

import "./chart.css";

export default class Chart extends React.Component {
  constructor(props) {
    super(props);

    GlobalState.ui.charts[this.props.id] = this;

    this.state = {
      id: this.props.id,
      indicators: {},
    };
  }

  addIndicator(renderingQueueId, indicator) {
    const indicators = this.state.indicators;
    indicators[renderingQueueId] = indicator;
    this.setState(() => (this.state.indicators = indicators));
  }

  render() {
    return (
      <div className="chart">
        <div className="overlay-padding">
          <div className="overlay">
            <div className="top-left">
              <div className="indicator-list">{this.renderIndicators()}</div>
            </div>
          </div>
        </div>
        <div className="chart"></div>
      </div>
    );
  }

  renderIndicators() {
    const keys = Object.keys(this.state.indicators);
    if (!keys.length) return;
    const indicators = keys.map((key) => (
      <Indicator indicator={this.state.indicators[key]} key={key} />
    ));
    return indicators;
  }
}
