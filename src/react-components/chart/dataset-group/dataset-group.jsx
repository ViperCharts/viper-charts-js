import React from "react";

import Indicator from "./indicator/indicator.jsx";

import "./dataset-group.css";

export default class DatsetGroup extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.chart = this.$global.charts[props.chartId];
  }

  toggleVisibility() {
    this.chart.toggleVisibility(this.props.renderingQueueId);
  }

  remove() {
    this.chart.removeDatasetGroup(this.props.renderingQueueId);
  }

  render() {
    const { datasetGroup, chartId } = this.props;
    const v = datasetGroup.visible;
    const dataset = datasetGroup.datasets[0];
    const indicatorIds = Object.keys(datasetGroup.indicators);

    console.log(datasetGroup);

    return (
      <div className={`dataset-group v-noselect ${v ? "" : "invisible"}`}>
        <div className="dataset-group-controls">
          <div className="dataset-group-title">
            {`${dataset.source}:${dataset.name}`}
          </div>
          <button onClick={this.toggleVisibility.bind(this)}>
            {v ? <i className="gg-eye"></i> : <i className="gg-eye-alt"></i>}
          </button>
          <button onClick={this.remove.bind(this)}>
            <i className="gg-close"></i>
          </button>
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
