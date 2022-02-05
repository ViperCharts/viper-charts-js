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
      this.chart = this.$global.charts[this.chartId];
    }

    setChartScaleType(type) {
      this.chart.setScaleType(type);
    }

    render() {
      return (
        <div>
          <button onClick={() => this.setChartScaleType("default")}>
            {this.chart.settings.scaleType === "default" ? (
              <i className="gg-check"></i>
            ) : null}
            Default
          </button>
          <button onClick={() => this.setChartScaleType("percent")}>
            {this.chart.settings.scaleType === "percent" ? (
              <i className="gg-check"></i>
            ) : null}
            Percent
          </button>
          <button onClick={() => this.setChartScaleType("normalized")}>
            {this.chart.settings.scaleType === "normalized" ? (
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
      const { chart, datasetGroup } = this.props;

      return (
        <div>
          <button>Change Dataset</button>
          <button>Add Indicator</button>
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
