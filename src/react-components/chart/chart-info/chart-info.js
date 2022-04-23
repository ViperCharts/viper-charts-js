import React from "react";
import constants from "../../../constants";

export default class ChartInfo extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      name: props.name,
      isNameEditMode: false,
    };
  }

  render() {
    const timeframeText = constants.getTimeframeText(this.props.timeframe);

    return (
      <div className="chart-info">
        <div>
          {this.state.name} • {timeframeText}
        </div>
      </div>
    );
  }
}
