import React from "react";

import candlestickSvg from "../../../../static/plot_types/bases/candlestick.svg";

import PlotTypes from "../../../../components/plot_types";

import "./indicators-modal.css";

export default {
  title: "Indicators",
  width: 100,
  height: 100,
  component: class IndicatorsModal extends React.Component {
    constructor(props) {
      super(props);

      this.$global = props.$global;

      this.chart = this.$global.charts[this.$global.selectedChartId];
      this.group = this.chart.datasetGroups[props.data.datasetGroupId];
      const { source, name } = this.group.datasets[0];
      this.dataSource = this.$global.data.getDataSource(source, name);

      this.state = {
        model: this.dataSource.models[0],
        childModel: null,
      };
    }

    setModel(model) {
      this.setState({ model });
    }

    setChildModel(childModel) {
      this.setState({ childModel });
    }

    addIndicator(indicatorId, offchart = false) {
      // Add the indicator to dataset group
      this.chart.addIndicator(indicatorId, this.group.id, this.state.model, {
        visible: true,
        layerId: !offchart ? Object.keys(this.chart.ranges.y)[0] : "new",
      });
    }

    async addModelGroup(offchart = false) {
      let layerId = !offchart ? Object.keys(this.chart.ranges.y)[0] : "new";

      for (const model of this.state.model.model) {
        const indicator = await this.chart.addIndicator(
          model.indicators[0],
          this.group.id,
          {
            ...model,
            id: this.state.model.id,
            childId: model.id,
          },
          {
            visible: true,
            layerId,
          }
        );

        if (layerId === "new") layerId = indicator.layerId;
      }
    }

    isIndicatorSupported({ dependencies }) {
      const dataModel = this.state.model;
      const { model } = dataModel;

      const validateModel = (m) => {
        if (dependencies[0] === "value" && m === "ohlc") {
          return true;
        }

        return m === dependencies[0];
      };

      // If is model ID, match model ID to dataset model ID
      if (typeof model === "string") {
        return validateModel(model);
      }

      // If dataModel has children
      if (Array.isArray(model)) {
        if (this.state.childModel === null) return false;
        return validateModel(this.state.childModel.model);
      }

      throw new Error(
        "Unreachable code reached. dataModel is not a valid type."
      );
    }

    render() {
      const bases = Object.values(PlotTypes.bases).filter(
        this.isIndicatorSupported.bind(this)
      );
      const indicators = Object.values(PlotTypes.indicators).filter(
        this.isIndicatorSupported.bind(this)
      );

      return (
        // Display horizontal grid of dataModels from source
        <div className="indicators-modal">
          <div className="dataset-models">
            <div>
              {this.dataSource.models.map((model) => (
                <button
                  onClick={() => this.setModel(model)}
                  key={model.id}
                  className={`button ${
                    model.id === this.state.model.id ? "button-selected" : ""
                  }`}
                  style={{ padding: "6px", marginRight: "6px" }}
                >
                  {model.name}
                </button>
              ))}
            </div>

            {Array.isArray(this.state.model.model) ? (
              <div className="dataset-models-children">
                Child Datasets
                <div>
                  <button
                    onClick={() => this.setChildModel(null)}
                    className={`button ${
                      this.state.childModel === null ? "button-selected" : ""
                    }`}
                    style={{ padding: "6px", marginRight: "6px" }}
                  >
                    All
                  </button>
                  {this.state.model.model.map((model) => (
                    <button
                      onClick={() => this.setChildModel(model)}
                      key={model.id}
                      className={`button button-sm ${
                        model.id === this.state.childModel?.id
                          ? "button-selected"
                          : ""
                      }`}
                      style={{ padding: "6px", marginRight: "6px" }}
                    >
                      {model.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {bases.length ? (
            <div style={{ margin: "12px 0px" }}>
              <span>Bases</span>
              {bases.map((indicator) => {
                return (
                  <div
                    className="indicator-list-item grouped-list-item"
                    key={indicator.id}
                  >
                    <button
                      onClick={() => this.addIndicator(indicator.id)}
                      className="add-indicator-btn-main"
                    >
                      {indicator.name}
                    </button>
                    <button
                      onClick={() => this.addIndicator(indicator.id, true)}
                    >
                      Off Chart
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {indicators.length ? (
            <div>
              <span>Indicators</span>
              {indicators.map((indicator) => {
                return (
                  <div
                    className="indicator-list-item grouped-list-item"
                    key={indicator.id}
                  >
                    <button
                      onClick={() => this.addIndicator(indicator.id)}
                      className="add-indicator-btn-main"
                    >
                      {indicator.name}
                    </button>
                    <button
                      onClick={() => this.addIndicator(indicator.id, true)}
                    >
                      Off Chart
                    </button>
                  </div>
                );
              })}
            </div>
          ) : null}

          {Array.isArray(this.state.model.model) &&
          this.state.childModel === null ? (
            <div>
              <div className="indicator-list-item grouped-list-item">
                <button
                  onClick={() => this.addModelGroup()}
                  className="add-indicator-btn-main"
                >
                  Add Group
                </button>
                <button onClick={() => this.addModelGroup(true)}>
                  Off Chart
                </button>
              </div>
            </div>
          ) : null}
        </div>
      );
    }
  },
};
