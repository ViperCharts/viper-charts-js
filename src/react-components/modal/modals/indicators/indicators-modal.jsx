import React from "react";

import { series, indicators } from "../../../../components/indicators";

export default class IndicatorsModal extends React.Component {
  constructor(props) {
    super(props);
  }

  addIndicator(indicator) {}

  render() {
    return (
      <div>
        <h1>Candle Types</h1>
        <div>{series.map(this.renderButton)}</div>
        <h1>Indicators</h1>
        <div>{indicators.map(this.renderButton)}</div>
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
