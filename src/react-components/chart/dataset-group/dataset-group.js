import React from "react";

import Indicator from "./indicator/indicator";

import "./dataset-group.css";

export default class DatsetGroup extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    const { datasets } = this.props.datasetGroup;
    this.chart = this.$global.charts[props.chartId];
    this.datasetId = `${datasets[0].source}:${datasets[0].name}:${this.chart.timeframe}`;
    this.dataset = this.$global.data.datasets[this.datasetId];

    this.state = {
      isMouseOver: false,
      pendingRequests: this.dataset.pendingRequests,
    };

    this.pendingRequestsListener = this.dataset.addEventListener(
      "pending-requests",
      (pr) => this.setState({ pendingRequests: pr })
    );

    this.timeframeChangeListener = this.chart.addEventListener(
      "set-timeframe",
      (timeframe) => {
        const datasetId = this.dataset.getTimeframeAgnosticId();
        this.dataset.removeEventListener(
          "pending-requests",
          this.pendingRequestsListener
        );
        this.datasetId = `${datasetId}:${timeframe}`;
        this.dataset = this.$global.data.datasets[this.datasetId];

        this.dataset.removeEventListener(
          "pending-requests",
          this.pendingRequestsListener
        );

        this.pendingRequestsListener = this.dataset.addEventListener(
          "pending-requests",
          (pr) => this.setState({ pendingRequests: pr })
        );
      }
    );

    this.updateDatasetGroupListener = this.chart.addEventListener(
      "update-dataset-group",
      (group) => {
        const { source, name } = group.datasets[0];
        this.datasetId = `${source}:${name}:${this.dataset.timeframe}`;
        this.dataset = this.$global.data.datasets[this.datasetId];

        this.dataset.removeEventListener(
          "pending-requests",
          this.pendingRequestsListener
        );

        this.pendingRequestsListener = this.dataset.addEventListener(
          "pending-requests",
          (pr) => this.setState({ pendingRequests: pr })
        );
      }
    );
  }

  componentWillUnmount() {
    this.dataset.removeEventListener(
      "pending-requests",
      this.pendingRequestsListener
    );
    this.chart.removeEventListener(
      "set-timeframe",
      this.timeframeChangeListener
    );
    this.chart.removeEventListener(
      "update-dataset-group",
      this.updateDatasetGroupListener
    );
  }

  toggleVisibility() {
    this.chart.toggleDatasetGroupVisibility(this.props.datasetGroup.id);
  }

  remove() {
    this.chart.removeDatasetGroup(this.props.datasetGroup.id);
  }

  render() {
    const { datasetGroup, chartId, isSelected } = this.props;
    const v = datasetGroup.visible;
    const dataset = datasetGroup.datasets[0];
    const indicatorIds = Object.keys(datasetGroup.indicators);

    const mo = this.state.isMouseOver;

    return (
      <div
        onMouseOver={() => this.setState({ isMouseOver: true })}
        onMouseOut={() => this.setState({ isMouseOver: false })}
        onContextMenu={(e) =>
          this.$global.ui.app.setContextMenu(e, "datasetGroup", {
            datasetGroupId: datasetGroup.id,
          })
        }
        className={`dataset-group v-noselect ${
          isSelected ? "dataset-group-selected" : ""
        } ${v ? "" : "invisible"}`}
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

        {indicatorIds.map((id) => {
          const indicator = datasetGroup.indicators[id];
          return (
            <Indicator
              $global={this.$global}
              chartId={chartId}
              datasetGroupId={datasetGroup.id}
              indicator={indicator}
              pendingRequests={this.state.pendingRequests[indicator.model.id]}
              renderingQueueId={id}
              key={id}
            />
          );
        })}
      </div>
    );
  }
}
