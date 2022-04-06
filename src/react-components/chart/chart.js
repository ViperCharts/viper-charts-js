import React from "react";

import DatasetGroup from "./dataset-group/dataset-group";
import ChartSettings from "./chart-settings/chart-settings";
import ChartInfo from "./chart-info/chart-info";

import "./chart.css";

import Constants from "../../constants";

export default class Chart extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.$global.ui.charts[this.props.id] = this;

    this.chart = this.$global.charts[this.props.id];

    const defaultName = `Untitled Chart ${
      Object.keys(this.$global.charts).indexOf(this.chart.id) + 1
    }`;

    this.state = {
      id: this.props.id,
      name: this.chart.name || defaultName,
      timeframe: this.chart.timeframe,
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

    this.setChartTimeframeListener = ((timeframe) =>
      this.setState({ timeframe })).bind(this);
    this.chart.addEventListener(
      "set-timeframe",
      this.setChartTimeframeListener
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
    this.chart.removeEventListener(
      "set-timeframe",
      this.setChartTimeframeListener
    );
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

  onDoubleClick({ clientY }, chart) {
    if (chart === "main") {
      const layerId = this.chart.getLayerByYCoord(clientY);
      this.chart.toggleLayerFullScreen(layerId);
    } else if (chart === "yScale") {
      const layerId = this.chart.getLayerByYCoord(clientY);
      const layer = this.chart.ranges.y[layerId];

      if (layer.lockedYScale === false) {
        layer.lockedYScale = true;
        this.chart.setVisibleRange(this.chart.ranges.x);
      }
    } else if (chart === "xScale") {
      this.chart.setInitialVisibleRange();
    }
  }

  onYScaleContextMenu(e) {
    this.$global.ui.app.setContextMenu(e, "yScale", {
      chartId: this.state.id,
      layerId: this.chart.getLayerByYCoord(e.clientY),
    });
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
              <ChartInfo
                name={this.state.name}
                timeframe={this.state.timeframe}
              />
              <div className="indicator-list">{this.renderDatasetGroups()}</div>
            </div>
            <div className="top-right">
              <ChartSettings $global={this.$global} chartId={this.state.id} />
            </div>
          </div>
        </div>
        <div className="chart-chart">
          <canvas
            onDoubleClick={(e) => this.onDoubleClick(e, "main")}
            className="chart-main"
            ref={this.subcharts.main}
          ></canvas>
          <canvas
            onDoubleClick={(e) => this.onDoubleClick(e, "xScale")}
            className="chart-x-axis"
            ref={this.subcharts.xScale}
          ></canvas>
          <canvas
            onDoubleClick={(e) => this.onDoubleClick(e, "yScale")}
            className="chart-y-axis"
            ref={this.subcharts.yScale}
            onContextMenuCapture={this.onYScaleContextMenu.bind(this)}
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
