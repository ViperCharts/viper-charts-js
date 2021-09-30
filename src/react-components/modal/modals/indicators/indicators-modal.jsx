import React from "react";

import GlobalState from "../../../../state/global";

import { series, indicators } from "../../../../components/indicators";

export default class IndicatorsModal extends React.Component {
  constructor(props) {
    super(props);
  }

  addIndicator(indicator) {
    // Get the currently selected chart
    const chart = GlobalState.charts.get(GlobalState.selectedChartId);
    chart.addIndicator(indicator);
  }

  render() {
    return (
      <div>
        <h1>Candle Types</h1>
        <div>{series.map(this.renderButton.bind(this))}</div>
        <h1>Indicators</h1>
        <div>{indicators.map(this.renderButton.bind(this))}</div>
      </div>
    );
  }

  renderButton(indicator) {
    return (
      <button onClick={() => this.addIndicator(indicator)} key={indicator.id}>
        {indicator.name}
      </button>
    );
  }
}
