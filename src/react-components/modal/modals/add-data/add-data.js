import React from "react";

import "./app-data.css";

export default {
  title: "Plot Data",
  width: 100,
  height: 100,
  component: class AddDataModal extends React.Component {
    constructor(props) {
      super(props);

      this.$global = props.$global;
      this.chart = this.$global.charts[this.$global.selectedChartId];
    }

    render() {
      const { datasetGroups } = this.chart;

      // List all dataset groups with indicators and full dataset source lists.
      return (
        <div>
          <h4 className="datset-group-list-title">
            Select a data source or create a new one.
          </h4>
          <div>
            {Object.keys(datasetGroups).map((id) => {
              const group = datasetGroups[id];
              const dataset = group.datasets[0];
              const str = `${dataset.source}:${dataset.name}`;

              return (
                <button
                  onClick={() =>
                    this.$global.ui.app.setModal("indicators", {
                      datasetGroupId: id,
                    })
                  }
                  key={id}
                  className="grouped-list-item"
                >
                  {str}
                </button>
              );
            })}
            {
              <button
                onClick={() => this.$global.ui.app.setModal("dataset-group")}
                className="grouped-list-item"
                style={{ marginTop: "16px" }}
              >
                Create New Group
              </button>
            }
          </div>
        </div>
      );
    }
  },
};
