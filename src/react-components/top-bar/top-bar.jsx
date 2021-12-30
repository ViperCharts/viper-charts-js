import React from "react";

import Constants from "../../constants";

import "./top-bar.css";

export default class TopBar extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.state = {
      selectedChart: null,
      timeframe: 0,
      timeframes: [
        Constants.MINUTE,
        Constants.MINUTE5,
        Constants.MINUTE15,
        Constants.HOUR,
        Constants.DAY,
      ],
      timeframeLabels: {},

      isIndicatorsButton: false,

      globalSettings: this.$global.settings.settings.global,

      isGridEditMode: this.$global.ui.isGridEditMode,
    };

    this.onSetSelectedChartId = ((id) => {
      this.setSelectedChart(this.$global.charts[id]);
    }).bind(this);
    this.$global.addEventListener(
      "set-selected-chart-id",
      this.onSetSelectedChartId
    );

    this.onSetIsGridEditMode = ((isGridEditMode) => {
      this.setState({ isGridEditMode });
    }).bind(this);
    this.$global.ui.addEventListener(
      "set-is-grid-edit-mode",
      this.onSetIsGridEditMode
    );

    this.setTimeframeListener = null;
  }

  componentDidMount() {
    this.buildTimeframeLabels();

    const { sources } = this.$global.data;
    if (sources && Object.keys(sources).length) {
      this.setState({ isIndicatorsButton: true });
    }
  }

  componentWillUnmount() {
    this.$global.removeEventListener(
      "set-selected-chart-id",
      this.onSetSelectedChartId
    );
    this.$global.ui.removeEventListener(
      "set-is-grid-edit-mode",
      this.onSetIsGridEditMode
    );
  }

  setSelectedChart(selectedChart) {
    // Remove old listener of previously set chart if a chart is set
    if (this.state.selectedChart && this.onSetTimeframe) {
      this.state.selectedChart.removeEventListener(
        "set-timeframe",
        this.setTimeframeListener
      );
    }

    this.setTimeframeListener = this.onSetTimeframe.bind(this);

    // Add event listener to new chart
    selectedChart.addEventListener("set-timeframe", this.setTimeframeListener);

    // Run the callback initially so we can capture the timeframe
    // This is because the timeframe is set in chart state initially
    // Before the listener is set above
    this.onSetTimeframe(selectedChart.timeframe);

    this.setState({ selectedChart });
  }

  onSetTimeframe(timeframe) {
    this.setState({ timeframe });
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
    this.$global.ui.app.setModal("indicators");
  }

  setTimeframe(timeframe) {
    this.state.selectedChart.setTimeframe(timeframe);
  }

  setIsGridEditMode() {
    this.$global.ui.setIsGridEditMode(!this.state.isGridEditMode);
  }

  render() {
    const { isIndicatorsButton, isGridEditMode } = this.state;

    return (
      <div className="top-bar">
        <button className="top-bar-item">🐍</button>
        {isIndicatorsButton ? (
          <button onClick={this.showIndicatorsModal} className="top-bar-item">
            Indicators
          </button>
        ) : null}
        {this.renderTimeframes()}
        <div className="top-bar-seperator"></div>
        {this.state.globalSettings.gridEdit ? (
          <button
            onClick={this.setIsGridEditMode.bind(this)}
            className="top-bar-item"
          >
            <i className="gg-display-grid"></i>
            {!isGridEditMode ? "Grid Locked" : "Grid Edit"}
          </button>
        ) : null}
      </div>
    );
  }

  renderTimeframes() {
    const labels = Object.keys(this.state.timeframeLabels);
    return labels.map((label) => {
      const tf = this.state.timeframeLabels[label];
      const isActive = tf.value === this.state.timeframe;
      return (
        <button
          key={label}
          onClick={() => this.setTimeframe(tf.value)}
          className={`top-bar-item ${isActive ? "timeframe__active" : ""}`}
        >
          {label}
        </button>
      );
    });
  }
}
