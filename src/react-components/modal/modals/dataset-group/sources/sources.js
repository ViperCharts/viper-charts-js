import React from "react";

export default class Sources extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.state = {
      sources: this.$global.data.sources,
      search: this.props.search,
      searchResults: [],
      keywords: getKeywords(this.$global.data.sources),
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
    const results = [];
    const regex = new RegExp(search);

    for (const { keywords, match } of this.state.keywords) {
      if (regex.test(keywords.join(":"))) {
        console.log(match);
        results.push(match);
      }
    }

    this.setState({ searchResults: results });
  }

  render() {
    return (
      <div>
        <div className="markets-search-box">
          <input
            value={this.state.search}
            onChange={this.onSearchInput.bind(this)}
            type="text"
            placeholder="Search for a data source here..."
            style={{
              textTransform: this.state.search.length ? "uppercase" : "none",
            }}
          />
        </div>
        <div className="datasets">
          {this.state.searchResults.map((dataset) => (
            <button
              onClick={() => this.onClickSource(dataset)}
              className="dataset grouped-list-item"
              key={`${dataset.source}:${dataset.name}`}
            >
              <h3 className="dataset-name">
                {dataset.source}
                <span style={{ opacity: "0.75" }}>{dataset.name}</span>
              </h3>
              <i style={{ opacity: "0.5" }}>
                {dataset.models.map((m) => m.name).join(", ")}
              </i>
            </button>
          ))}
        </div>
      </div>
    );
  }
}

function getKeywords(sources) {
  const keywords = [];

  for (const sourceId in sources) {
    const markets = sources[sourceId];

    for (const market of markets) {
      const { source, name, models } = market;

      const matches = [];

      for (const model of models) {
        matches.push(`${source}:${name}:${model.name}`.replaceAll(/\W:/g, ""));
      }

      keywords.push({
        matches,
        match: market,
      });
    }
  }

  console.log(keywords);

  return keywords;
}
