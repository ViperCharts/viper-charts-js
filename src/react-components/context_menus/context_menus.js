import React from "react";

import "./context_menus.css";

export default class ContextMenus extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;
  }

  render() {
    const { id, data } = this.props;

    const ContextMenu = contextMenus[id];
    if (!ContextMenu) return null;

    return (
      <div className="context-menu">
        <ContextMenu $global={this.$global} data={data} />
      </div>
    );
  }
}

const contextMenus = {
  main: class MainChartContextMenu extends React.Component {
    constructor(props) {
      super(props);

      this.$global = props.$global;

      this.chartId = props.data.chartId;
      this.layerId = props.data.layerId;
      this.chart = this.$global.charts[this.chartId];
      this.layer = this.chart.ranges.y[this.layerId];
    }

    resetScale() {
      this.layer.lockedYScale = true;
      this.chart.setVisibleRange({}, this.layerId);
    }

    resetChart() {
      for (const id in this.chart.ranges.y) {
        this.chart.ranges.y[id].lockedYScale = true;
      }
      this.chart.setInitialVisibleRange();
    }

    toggleFullScreen() {
      this.chart.toggleLayerFullScreen(this.layerId);
    }

    clearChart() {
      for (const id in this.chart.datasetGroups) {
        this.chart.removeDatasetGroup(id);
      }
    }

    deleteLayer() {
      this.chart.removeLayer(this.layerId);
    }

    deleteChart() {
      this.$global.setSelectedChartId(this.chartId);
      this.$global.deleteSelectedChart();
    }

    render() {
      return (
        <div>
          <button onClick={this.resetScale.bind(this)}>Reset Scale</button>
          <button onClick={this.resetChart.bind(this)}>Reset Chart View</button>
          <button onClick={this.toggleFullScreen.bind(this)}>
            {this.layer.fullscreen ? <i className="gg-check"></i> : null}
            FullScreen
          </button>
          <button onClick={this.clearChart.bind(this)}>Clear Chart</button>
          <button onClick={this.deleteLayer.bind(this)}>Delete Layer</button>
          <button
            onClick={this.deleteChart.bind(this)}
            disabled={Object.keys(this.$global.charts).length === 1}
          >
            Delete Chart
          </button>
        </div>
      );
    }
  },

  yScale: class YScaleContextMenu extends React.Component {
    constructor(props) {
      super(props);

      this.$global = props.$global;

      this.chartId = props.data.chartId;
      this.layerId = props.data.layerId;
      this.chart = this.$global.charts[this.chartId];
      this.layer = this.chart.ranges.y[this.layerId];
    }

    setChartScaleType(type) {
      this.chart.setLayerScaleType(this.layerId, type);
    }

    render() {
      return (
        <div>
          <button onClick={() => this.setChartScaleType("default")}>
            {this.layer.scaleType === "default" ? (
              <i className="gg-check"></i>
            ) : null}
            Default
          </button>
          <button onClick={() => this.setChartScaleType("percent")}>
            {this.layer.scaleType === "percent" ? (
              <i className="gg-check"></i>
            ) : null}
            Percent
          </button>
          <button onClick={() => this.setChartScaleType("normalized")}>
            {this.layer.scaleType === "normalized" ? (
              <i className="gg-check"></i>
            ) : null}
            Normalized
          </button>
        </div>
      );
    }
  },

  datasetGroup: class DatasetGroupContextMenu extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      const { datasetGroupId } = this.props.data;

      return (
        <div>
          <button
            onClick={() => {
              this.props.$global.ui.app.setModal("change-dataset", {
                datasetGroupId,
              });
            }}
          >
            Change Dataset
          </button>
          <button
            onClick={() => {
              this.props.$global.ui.app.setModal("indicators", {
                datasetGroupId,
              });
            }}
          >
            Add Indicator
          </button>
        </div>
      );
    }
  },

  indicator: class IndicatorContextMenu extends React.Component {
    constructor(props) {
      super(props);
    }

    render() {
      const { chart, indicator } = this.props;

      return (
        <div>
          <button>Change Indicator</button>
        </div>
      );
    }
  },
};
