import React from "react";

import GlobalState from "../../../state/global";

import "./chart-settings.css";

export default class ChartSettings extends React.Component {
  constructor(props) {
    super(props);

    this.chart = GlobalState.charts.get(this.props.chartId);
    this.state = {
      settings: this.chart.settings,
    };
  }

  updateChartSetting(setting, value) {
    this.chart.updateSettings({ [setting]: value });
    console.log(this.state.settings[setting]);
  }

  render() {
    return (
      <div className="chart-settings">
        <label>
          <input
            value={this.state.settings.syncRange}
            onClick={() =>
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
