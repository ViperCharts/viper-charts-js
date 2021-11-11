import React from "react";

import GlobalState from "../../../../state/global";

import { series, indicators } from "../../../../components/indicators";

import "./indicators-modal.css";

export default {
  title: "Datasets & Indicators",
  width: 100,
  height: 100,
  component: class IndicatorsModal extends React.Component {
    constructor(props) {
      super(props);

      this.state = {
        sources: GlobalState.data.sources,
        selectedIndicator: {},
        search: "",
        searchResults: [],
      };

      GlobalState.data.addEventListener("set-all-data-sources", (all) => {
        this.setState({ sources: all });
        this.updateSearchResults(this.state.search);
      });
    }

    componentDidMount() {
      this.updateSearchResults();
    }

    /**
     * Add an indicator with spefified dataset
     * @param {object} searchResult The datasaet from searchResults array
     */
    addIndicator(searchResult) {
      const chart = GlobalState.charts[GlobalState.selectedChartId];
      const indicator = this.state.selectedIndicator;
      chart.addIndicator(indicator, searchResult);
    }

    onSearchInput({ target }) {
      target = target.value.toLowerCase();
      this.setState({ search: target.toUpperCase() });
      this.updateSearchResults(target);
    }

    updateSearchResults(search = "") {
      const { sources } = this.state;

      // Filter by dataset id
      const results = [];

      for (const sourceId of Object.keys(sources)) {
        const source = sources[sourceId];
        for (const dataset of source) {
          const { name } = dataset;
          const id = `${sourceId}:${name}`.toLowerCase();
          if (search.length === 0 || id.match(search)) {
            results.push({
              ...dataset,
              source: sourceId,
            });
          }
        }
      }

      this.setState({ searchResults: results });
    }

    render() {
      return (
        <div className="indicators-modal">
          <div className="indicators">
            {series.map(this.renderButton.bind(this))}
            {indicators.map(this.renderButton.bind(this))}
          </div>
          <div className="markets-search-box">
            <input
              onInput={this.onSearchInput.bind(this)}
              value={this.state.search}
              type="text"
              placeholder="Search for a data source here..."
            />
          </div>
          <div className="datasets">
            {this.state.searchResults.map((result) => (
              <button
                onClick={() => this.addIndicator(result)}
                className="dataset"
                key={`${result.source}:${result.name}`}
              >
                <small className="dataset-source">{result.source}</small>
                <h3 className="dataset-name">{result.name}</h3>
              </button>
            ))}
          </div>
        </div>
      );
    }

    renderButton(indicator) {
      const { selectedIndicator } = this.state;
      const selected = selectedIndicator.id === indicator.id;

      return (
        <button
          onClick={() => this.setState({ selectedIndicator: indicator })}
          key={indicator.id}
          className={`indicator-button ${
            selected ? "indicator-button__selected" : ""
          }`}
        >
          {indicator.name}
        </button>
      );
    }
  },
};
