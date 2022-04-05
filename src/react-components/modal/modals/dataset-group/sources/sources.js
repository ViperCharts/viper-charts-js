import React from "react";

export default class Sources extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.state = {
      sources: this.$global.data.sources,
      search: "",
      searchResults: [],
    };

    this.onClickSource = props.onClickSource;

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

        const dataModelsStr = dataset.models.map((m) => m.name).join(", ");
        const id = `${sourceId} ${name} ${dataModelsStr}`.toLowerCase();

        if (search.length === 0 || regex.test(id)) {
          results.push({
            dataset,
            dataModelsStr,
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
          {this.state.searchResults.map(({ dataset, dataModelsStr }) => (
            <button
              onClick={() => this.onClickSource(dataset)}
              className="dataset grouped-list-item"
              key={`${dataset.source}:${dataset.name}`}
            >
              <h3 className="dataset-name">
                {dataset.source}
                <span style={{ opacity: "0.75" }}>{dataset.name}</span>
              </h3>
              <i style={{ opacity: "0.5" }}>{dataModelsStr}</i>
            </button>
          ))}
        </div>
      </div>
    );
  }
}
