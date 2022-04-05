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
