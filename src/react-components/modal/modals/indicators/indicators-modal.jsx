import React from "react";

import GlobalState from "../../../../state/global";

import { series, indicators } from "../../../../components/indicators";

import "./indicators-modal.css";

export default class IndicatorsModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      sources: GlobalState.data.sources,
      expandedSource: "",
      expandedIds: [],
    };

    GlobalState.data.addEventListener("set-all-data-sources", (all) => {
      this.setState({ sources: all });
    });
  }

  toggleExpandedSource(expandedSource) {
    if (this.state.expandedSource === expandedSource) {
      expandedSource = "";
    }
    this.setState({ expandedSource });
  }

  toggleExpanded(id) {
    let { expandedIds } = this.state;
    const i = expandedIds.indexOf(id);
    if (i > -1) {
      expandedIds.splice(i, 1);
    } else {
      expandedIds.push(id);
    }
    this.setState({ expandedIds });
  }

  addIndicator(indicator, dataset) {
    const chart = GlobalState.charts[GlobalState.selectedChartId];
    chart.addIndicator(indicator);
  }

  render() {
    const sourceIds = Object.keys(this.state.sources);
    const { expandedSource } = this.state;
    const source = this.state.sources[expandedSource];

    return (
      <div className="indicators-modal">
        <div className="sources">
          {sourceIds.map((id) => {
            const expanded = expandedSource === id;
            return (
              <button
                onClick={() => this.toggleExpandedSource(id)}
                key={id}
                className={`source ${expanded ? "source-expanded" : ""}`}
              >
                <h2 className="source-id">{id}</h2>
              </button>
            );
          })}
        </div>
        <div className="datasets">
          {source
            ? source.map((dataset) => (
                <div
                  className="dataset"
                  key={`${expandedSource}:${dataset.name}`}
                >
                  <h3 className="dataset-name">{dataset.name}</h3>
                  <div>{series.map((i) => this.renderButton(i, dataset))}</div>
                  <div>
                    {indicators.map((i) => this.renderButton(i, dataset))}
                  </div>
                </div>
              ))
            : null}
        </div>
      </div>
    );
  }

  renderButton(indicator, dataset) {
    return (
      <button
        onClick={() => this.addIndicator(indicator, dataset)}
        key={indicator.id}
        className="indicator-button"
      >
        {indicator.name}
      </button>
    );
  }
}
