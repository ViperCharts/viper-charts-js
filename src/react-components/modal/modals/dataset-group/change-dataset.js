import React from "react";

import Sources from "./sources/sources";

import "./dataset-group.css";

export default {
  title: "Change Dataset",
  width: 100,
  height: 100,
  component: class DatasetGroupModal extends React.Component {
    constructor(props) {
      super(props);

      this.datasetGroupId = props.data.datasetGroupId;
      this.$global = props.$global;
    }

    changeDataset(dataset) {
      const chart = this.$global.charts[this.$global.selectedChartId];
      chart.updateDatasetGroup(this.datasetGroupId, [dataset]);

      // Close the modal
      this.$global.ui.app.setModal("");
    }

    render() {
      return (
        <Sources
          $global={this.$global}
          search={this.props.data.search}
          onClickSource={this.changeDataset.bind(this)}
        />
      );
    }
  },
};
