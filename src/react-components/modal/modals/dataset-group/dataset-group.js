import React from "react";

import Sources from "./sources/sources";

import "./dataset-group.css";

export default {
  title: "Add Dataset",
  width: 100,
  height: 100,
  component: class DatasetGroupModal extends React.Component {
    constructor(props) {
      super(props);

      this.$global = props.$global;
    }

    addDatsetGroup(dataset) {
      const chart = this.$global.charts[this.$global.selectedChartId];
      const { id } = chart.createDatasetGroup([dataset], {
        visible: true,
      });

      // Redirect modal to add indicators
      this.$global.ui.app.setModal("indicators", { datasetGroupId: id });
    }

    render() {
      return (
        <Sources
          $global={this.$global}
          search={this.props.data.search}
          onClickSource={this.addDatsetGroup.bind(this)}
        />
      );
    }
  },
};
