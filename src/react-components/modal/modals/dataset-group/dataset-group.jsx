import React from "react";

import "./dataset-group.css";

export default {
  title: "Create Datset Group",
  width: 100,
  height: 100,
  component: class DatasetGroupModal extends React.Component {
    constructor(props) {
      super(props);

      this.$global = props.$global;

      this.state = {
        sources: this.$global.data.sources,
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

    addDatsetGroup(searchResult) {
      const chart = this.$global.charts[this.$global.selectedChartId];
      const { id } = chart.createDatasetGroup([searchResult], {
        visible: true,
      });

      // Redirect modal to add indicators
      this.$global.ui.app.setModal("indicators", { datasetGroupId: id });
    }

    onSearchInput({ target }) {
      const search = target.value.toLowerCase();
      this.setState({ search });
      this.updateSearchResults(search);
    }

    updateSearchResults(search = "") {
      const { sources } = this.state;

      // Filter by dataset id
      const results = [];
      const regex = new RegExp(search.split("").join(".*"));

      for (const sourceId of Object.keys(sources)) {
        const source = sources[sourceId];

        for (const dataset of source) {
          const { name } = dataset;
          const id = `${sourceId}:${name}`.toLowerCase();

          if (search.length === 0 || regex.test(id)) {
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
        <div>
          <div className="markets-search-box">
            <input
              onInput={this.onSearchInput.bind(this)}
              type="text"
              placeholder="Search for a data source here..."
              style={{ textTransform: "uppercase" }}
            />
          </div>
          <div className="datasets">
            {this.state.searchResults.map((result) => (
              <button
                onClick={() => this.addDatsetGroup(result)}
                className="dataset grouped-list-item"
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
  },
};
