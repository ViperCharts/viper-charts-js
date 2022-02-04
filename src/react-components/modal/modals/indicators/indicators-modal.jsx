import React from "react";

import indicators from "../../../../components/indicators";

import "./indicators-modal.css";

export default {
  title: "Datasets & Indicators",
  width: 100,
  height: 100,
  component: class IndicatorsModal extends React.Component {
    constructor(props) {
      super(props);

      this.$global = props.$global;

      this.state = {
        sources: this.$global.data.sources,
        selectedIndicatorId: "",
        search: "",
        searchResults: [],
      };

      this.setAllDataSourcesListener = ((all) => {
        this.setState({ sources: all });
        this.updateSearchResults(this.state.search);
      }).bind(this);
      this.$global.data.addEventListener(
        "set-all-data-sources",
        this.setAllDataSourcesListener
      );
    }

    componentDidMount() {
      this.updateSearchResults(this.state.search);
    }

    componentWillUnmount() {
      this.$global.data.removeEventListener(
        "set-all-data-sources",
        this.setAllDataSourcesListener
      );
    }

    /**
     * Add an indicator with spefified dataset
     * @param {object} searchResult The datasaet from searchResults array
     */
    addIndicator(searchResult) {
      const chart = this.$global.charts[this.$global.selectedChartId];

      // Create a datsaet group
      const group = chart.createDatasetGroup([searchResult], { visible: true });

      // Add the indicator to dataset group
      for (let i = 0; i < 5; i++) {
        chart.addIndicator(this.state.selectedIndicatorId, group.id, {
          visible: true,
        });
      }
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
            {Object.keys(indicators).map(this.renderButton.bind(this))}
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
            {this.state.selectedIndicatorId
              ? this.state.searchResults.map((result) => (
                  <button
                    onClick={() => this.addIndicator(result)}
                    className="dataset"
                    key={`${result.source}:${result.name}`}
                  >
                    <small className="dataset-source">{result.source}</small>
                    <h3 className="dataset-name">{result.name}</h3>
                  </button>
                ))
              : null}
          </div>
        </div>
      );
    }

    renderButton(indicatorId) {
      const { selectedIndicatorId } = this.state;
      const selected = selectedIndicatorId === indicatorId;
      const indicator = indicators[indicatorId];

      return (
        <button
          onClick={() => this.setState({ selectedIndicatorId: indicatorId })}
          key={indicatorId}
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
