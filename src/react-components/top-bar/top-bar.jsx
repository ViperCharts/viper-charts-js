import React from "react";

import GlobalState from "../../state/global";

import Constants from "../../constants";

import "./top-bar.css";

export default class TopBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      timeframes: [
        Constants.MINUTE,
        Constants.MINUTE5,
        Constants.MINUTE15,
        Constants.HOUR,
        Constants.HOUR * 6,
        Constants.DAY,
      ],
      timeframeLabels: {},
    };
  }

  componentDidMount() {
    this.buildTimeframeLabels();
  }

  buildTimeframeLabels() {
    const timeframeLabels = {};

    const { TIMEFRAMES } = Constants;
    const tfKeys = Object.keys(TIMEFRAMES);

    for (const tf of this.state.timeframes) {
      // Loop through every timeframe and verify it's between current tf and next tf
      for (let i = 0; i < tfKeys.length; i++) {
        const currKey = tfKeys[i];
        const curr = TIMEFRAMES[currKey];
        const nextKey = tfKeys[i + 1];
        const next = TIMEFRAMES[nextKey];

        if (tf >= curr && tf < next) {
          const diff = tf / curr;

          if (Math.round(diff) !== diff) {
            console.error("Decimal based timeframes now allowed");
            return;
          }

          const label = `${diff}${currKey}`;
          timeframeLabels[label] = {
            label,
            value: tf,
          };
        }
      }
    }

    this.setState({ timeframeLabels });
  }

  showIndicatorsModal() {
    GlobalState.ui.app.setModal("indicators");
  }

  render() {
    const { isGridEditMode } = GlobalState.ui.state;

    return (
      <div className="top-bar">
        <button className="top-bar-item">🐍</button>
        <button onClick={this.showIndicatorsModal} className="top-bar-item">
          Indicators
        </button>
        {this.renderTimeframes()}
        <div className="top-bar-seperator"></div>
        <button
          onClick={() =>
            GlobalState.ui.setState({ isGridEditMode: !isGridEditMode })
          }
          className="top-bar-item"
        >
          <i className="gg-display-grid"></i>
          {!isGridEditMode ? "Grid Locked" : "Grid Edit"}
        </button>
      </div>
    );
  }

  renderTimeframes() {
    const labels = Object.keys(this.state.timeframeLabels);
    return labels.map((label) => {
      return (
        <button key={label} className="top-bar-item">
          {label}
        </button>
      );
    });
  }
}
