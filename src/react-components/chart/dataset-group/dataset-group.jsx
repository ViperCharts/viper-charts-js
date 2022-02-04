import React from "react";

import Indicator from "./indicator/indicator.jsx";

import "./dataset-group.css";

export default class DatsetGroup extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.chart = this.$global.charts[props.chartId];

    this.state = {
      isMouseOver: false,
    };
  }

  toggleVisibility() {
    this.chart.toggleDatasetGroupVisibility(this.props.datasetGroup.id);
  }

  remove() {
    this.chart.removeDatasetGroup(this.props.datasetGroup.id);
  }

  render() {
    const { datasetGroup, chartId } = this.props;
    const v = datasetGroup.visible;
    const dataset = datasetGroup.datasets[0];
    const indicatorIds = Object.keys(datasetGroup.indicators);

    const mo = this.state.isMouseOver;

    return (
      <div
        onMouseOver={() => this.setState({ isMouseOver: true })}
        onMouseOut={() => this.setState({ isMouseOver: false })}
        onContextMenuCapture={(e) =>
          this.$global.ui.app.setContextMenu(e, "yScale", {
            chartId: this.chart.id,
            datasetGroupId: datasetGroup.id,
          })
        }
        className={`dataset-group v-noselect ${v ? "" : "invisible"}`}
      >
        <div className="dataset-group-info">
          <div className="dataset-group-title">
            {`${dataset.source}:${dataset.name}`}
          </div>

          <div
            className="dataset-group-controls"
            style={{ visibility: mo ? "visible" : "hidden" }}
          >
            <button onClick={this.toggleVisibility.bind(this)}>
              {v ? <i className="gg-eye"></i> : <i className="gg-eye-alt"></i>}
            </button>
            <button onClick={this.remove.bind(this)}>
              <i className="gg-close"></i>
            </button>
          </div>
        </div>

        {indicatorIds.map((id) => (
          <Indicator
            $global={this.$global}
            chartId={chartId}
            datasetGroupId={datasetGroup.id}
            indicator={datasetGroup.indicators[id]}
            renderingQueueId={id}
            key={id}
          />
        ))}
      </div>
    );
  }
}
