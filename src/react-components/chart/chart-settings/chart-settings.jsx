import React from "react";

import GlobalState from "../../../state/global";

import "./chart-settings.css";

export default class ChartSettings extends React.Component {
  constructor(props) {
    super(props);

    this.chart = GlobalState.charts[this.props.chartId];
    this.state = {
      settings: this.chart.settings,
    };

    this.updateSettingsListener = (() => this.forceUpdate()).bind(this);
    this.chart.addEventListener("update-settings", this.updateSettingsListener);
  }

  updateChartSetting(setting, value) {
    this.chart.updateSettings({ [setting]: value });
  }

  componentWillUnmount() {
    this.chart.removeEventListener(
      "update-settings",
      this.updateSettingsListener
    );
  }

  render() {
    return (
      <div className="chart-settings">
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
      </div>
    );
  }
}
