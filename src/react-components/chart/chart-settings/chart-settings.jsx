import React from "react";

import "./chart-settings.css";

export default class ChartSettings extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.chart = this.$global.charts[this.props.chartId];
    this.state = {
      settings: this.chart.settings,

      isSyncTimeButton: Object.keys(this.$global.charts).length > 1,
    };

    this.updateSettingsListener = (() => this.forceUpdate()).bind(this);
    this.chart.addEventListener("update-settings", this.updateSettingsListener);

    this.chartsChangeListener = () =>
      this.setState({
        isSyncTimeButton: Object.keys(this.$global.charts).length > 1,
      });
    this.$global.addEventListener("charts-change", this.chartsChangeListener);
  }

  updateChartSetting(setting, value) {
    this.chart.updateSettings({ [setting]: value });
  }

  componentWillUnmount() {
    this.chart.removeEventListener(
      "update-settings",
      this.updateSettingsListener
    );
    this.$global.removeEventListener(
      "charts-change",
      this.chartsChangeListener
    );
  }

  render() {
    const { isSyncTimeButton } = this.state;

    return (
      <div className="chart-settings">
        {isSyncTimeButton ? (
          <label>
            <input
              checked={this.state.settings.syncRange}
              onChange={() =>
                this.updateChartSetting(
                  "syncRange",
                  !this.state.settings.syncRange
                )
              }
              type="checkbox"
            />
            Sync Time
          </label>
        ) : null}
      </div>
    );
  }
}
