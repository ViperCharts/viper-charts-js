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

      this.state = {
        model: this.group.datasets[0].models[0],
      };
    }

    setModel(model) {
      this.setState({ model });
    }

    addIndicator(indicatorId, offchart = false) {
      let chart = this.chart;

      if (offchart) {
        chart = this.$global.createChart({
          pixelsPerElement: chart.pixelsPerElement,
          range: chart.range,
          settings: {
            syncRange: true,
          },
        });
      }

      // Add the indicator to dataset group
      chart.addIndicator(indicatorId, this.group.id, this.state.model, {
        visible: true,
      });
    }

    isIndicatorSupported({ dependencies }) {
      if (dependencies[0] === "value" && this.state.model.model === "ohlc")
        return true;
      return this.state.model.model === dependencies[0];
    }

    render() {
      return (
        // Display horizontal grid of dataModels from source
        <div className="indicators-modal">
          <div className="dataset-models">
            {this.group.datasets[0].models.map((model) => (
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

          <div style={{ margin: "12px 0px" }}>
            <span>Bases</span>
            {Object.values(PlotTypes.bases)
              .filter(this.isIndicatorSupported.bind(this))
              .map((indicator) => {
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

          <div>
            <span>Indicators</span>
            {Object.values(PlotTypes.indicators)
              .filter(this.isIndicatorSupported.bind(this))
              .map((indicator) => {
                return (
                  <button
                    onClick={() => this.addIndicator(indicator.id)}
                    key={indicator.id}
                    className="grouped-list-item"
                  >
                    {indicator.name}
                  </button>
                );
              })}
          </div>
        </div>
      );
    }
  },
};
