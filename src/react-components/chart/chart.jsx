import React from "react";

import GlobalState from "../../state/global";

import Indicator from "./indicator/indicator";
import ChartSettings from "./chart-settings/chart-settings";

import "./chart.css";

export default class Chart extends React.Component {
  constructor(props) {
    super(props);
    GlobalState.ui.charts[this.props.id] = this;

    this.chart = GlobalState.charts[this.props.id];

    this.state = {
      id: this.props.id,
      name: this.chart.name,
      indicators: this.chart.indicators,

      isFocused: GlobalState.selectedChartId === this.props.id,
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
    GlobalState.addEventListener(
      "set-selected-chart-id",
      this.setSelectedChartListener
    );
  }

  componentDidMount() {
    const { clientWidth, clientHeight } = this.chartContainer.current;
    GlobalState.layout.addChart(this.state.id, clientWidth, clientHeight);
    this.chart = GlobalState.charts[this.state.id];

    // If React component is re-mounting on an existing initialized chart state
    if (this.chart.isInitialized) {
      this.chart.onNewCanvas();
      return;
    }

    this.chart.init();
  }

  componentDidUpdate() {
    const { clientWidth, clientHeight } = this.chartContainer.current;
    GlobalState.layout.updateSize(this.state.id, clientWidth, clientHeight);
  }

  componentWillUnmount() {
    GlobalState.removeEventListener(
      "set-selected-chart-id",
      this.setSelectedChartListener
    );
  }

  addIndicator(renderingQueueId, indicator) {
    const indicators = this.state.indicators;
    indicators[renderingQueueId] = indicator;
    this.setState(() => (this.state.indicators = indicators));
  }

  updateIndicator(renderingQueueId, updates) {
    const indicators = this.state.indicators;
    Object.assign(indicators[renderingQueueId], updates);
    this.setState(() => (this.state.indicators = indicators));
  }

  removeIndicator(renderingQueueId) {
    const indicators = this.state.indicators;
    delete indicators[renderingQueueId];
    this.setState(() => (this.state.indicators = indicators));
  }

  /**
   * When user clicks chart, set as selected chart
   */
  onFocusChart() {
    if (!this.state.isFocused) {
      GlobalState.setSelectedChartId(this.state.id);
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
              <div className="indicator-list">{this.renderIndicators()}</div>
            </div>
            <div className="top-right">
              <ChartSettings chartId={this.state.id} />
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
    const multipleCharts = Object.keys(GlobalState.charts).length > 1;
    return this.state.isFocused && multipleCharts ? (
      <div className="chart__focused"></div>
    ) : null;
  }

  renderIndicators() {
    const keys = Object.keys(this.state.indicators);
    if (!keys.length) return;
    const indicators = keys.map((key) => (
      <Indicator
        chartId={this.state.id}
        indicator={this.state.indicators[key]}
        renderingQueueId={key}
        key={key}
      />
    ));
    return indicators;
  }
}
