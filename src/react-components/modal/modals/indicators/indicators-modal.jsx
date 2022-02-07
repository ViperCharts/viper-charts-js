import React from "react";

import indicators from "../../../../components/indicators";

import "./indicators-modal.css";

export default {
  title: "Indicators",
  width: 100,
  height: 100,
  component: class IndicatorsModal extends React.Component {
    constructor(props) {
      super(props);

      this.$global = props.$global;
    }

    addIndicator(indicatorId) {
      const chart = this.$global.charts[this.$global.selectedChartId];
      console.log(this.props.data);
      const group = chart.datasetGroups[this.props.data.datasetGroupId];

      // Add the indicator to dataset group
      chart.addIndicator(indicatorId, group.id, {
        visible: true,
      });
    }

    render() {
      return (
        <div className="indicators-modal">
          {Object.keys(indicators).map((id) => {
            const indicator = indicators[id];

            return (
              <button
                onClick={() => this.addIndicator(id)}
                key={id}
                className="grouped-list-item"
              >
                {indicator.name}
              </button>
            );
          })}
        </div>
      );
    }
  },
};
