import React from "react";

import DatasetGroup from "./dataset-group/dataset-group.jsx";
import ChartSettings from "./chart-settings/chart-settings";

import "./chart.css";

export default class Chart extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.$global.ui.charts[this.props.id] = this;

    this.chart = this.$global.charts[this.props.id];

    this.state = {
      id: this.props.id,
      name: this.chart.name,
      datasetGroups: this.chart.datasetGroups,

      isFocused: this.$global.selectedChartId === this.props.id,
    };

    this.subcharts = {
      main: new React.createRef(),
      xScale: new React.createRef(),
      yScale: new React.createRef(),
    };

    this.chartContainer = new React.createRef();
    this.setSelectedChartListener = ((id) => {
      if (this.state.id !== id) {
        if (this.state.isFocused) {
          this.setState({ isFocused: false });
        }
        return;
      }
      this.setState({ isFocused: true });
    }).bind(this);
    this.$global.addEventListener(
      "set-selected-chart-id",
      this.setSelectedChartListener
    );

    this.setChartNameListener = ((name) => this.setState({ name })).bind(this);
    this.chart.addEventListener("set-name", this.setChartNameListener);
  }

  componentDidMount() {
    const { clientWidth, clientHeight } = this.chartContainer.current;
    this.$global.layout.addChart(this.state.id, clientWidth, clientHeight);
    this.chart = this.$global.charts[this.state.id];

    // If React component is re-mounting on an existing initialized chart state
    if (this.chart.isInitialized) {
      this.chart.onNewCanvas();
      return;
    }

    this.chart.init();
  }

  componentDidUpdate() {
    const { clientWidth, clientHeight } = this.chartContainer.current;
    this.$global.layout.updateSize(this.state.id, clientWidth, clientHeight);
  }

  componentWillUnmount() {
    this.$global.removeEventListener(
      "set-selected-chart-id",
      this.setSelectedChartListener
    );
    this.chart.removeEventListener("set-name", this.setChartNameListener);
  }

  updateDatasetGroups(datasetGroups) {
    this.setState({ datasetGroups });
  }

  /**
   * When user clicks chart, set as selected chart
   */
  onFocusChart() {
    if (!this.state.isFocused) {
      this.$global.setSelectedChartId(this.state.id);
    }
  }

  onDoubleClick(chart) {
    if (chart === "yScale" && !this.chart.settings.lockedYScale) {
      this.chart.settings.lockedYScale = true;
      const { start, end } = this.chart.range;
      this.chart.setVisibleRange({ start, end });
    }
  }

  render() {
    return (
      <div
        onMouseDown={this.onFocusChart.bind(this)}
        ref={this.chartContainer}
        className="chart v-noselect"
      >
        {this.renderFocusedChart()}
        <div className="overlay-padding">
          <div className="overlay">
            <div className="top-left">
              <div className="chart-name">{this.state.name}</div>
              <div className="indicator-list">{this.renderDatasetGroups()}</div>
            </div>
            <div className="top-right">
              <ChartSettings $global={this.$global} chartId={this.state.id} />
            </div>
          </div>
        </div>
        <div className="chart-chart">
          <canvas
            className="chart-main"
            ref={this.subcharts.main}
            context_menu_id="main"
            context_menu_data={JSON.stringify({ chartId: this.state.id })}
          ></canvas>
          <canvas
            className="chart-x-axis"
            ref={this.subcharts.xScale}
            context_menu_id="xScale"
            context_menu_data={JSON.stringify({ chartId: this.state.id })}
          ></canvas>
          <canvas
            onDoubleClick={() => this.onDoubleClick("yScale")}
            className="chart-y-axis"
            ref={this.subcharts.yScale}
            context_menu_id="yScale"
            context_menu_data={JSON.stringify({ chartId: this.state.id })}
          ></canvas>
        </div>
      </div>
    );
  }

  renderFocusedChart() {
    const multipleCharts = Object.keys(this.$global.charts).length > 1;
    return this.state.isFocused && multipleCharts ? (
      <div className="chart__focused"></div>
    ) : null;
  }

  renderDatasetGroups() {
    const keys = Object.keys(this.state.datasetGroups);
    if (!keys.length) return;
    return keys.map((key) => (
      <DatasetGroup
        $global={this.$global}
        chartId={this.state.id}
        datasetGroup={this.state.datasetGroups[key]}
        key={key}
      />
    ));
  }
}
