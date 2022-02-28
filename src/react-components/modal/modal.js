import React from "react";

import AddDataModal from "./modals/add-data/add-data";
import IndicatorsModal from "./modals/indicators/indicators-modal";
import DatasetGroupModal from "./modals/dataset-group/dataset-group";

import "./modal.css";

export default class Modal extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;
  }

  close() {
    this.$global.ui.app.setModal("");
  }

  render() {
    const { id } = this.props;

    let modal = getModal(id);
    const { title, component: Component, height = 0, width = 0 } = modal;

    return (
      <div className="modal-container">
        <div
          className="modal"
          style={{ height: `${height}%`, width: `${width}%` }}
        >
          <div className="modal-top">
            <h1>{title}</h1>
            <button>
              <i onClick={this.close.bind(this)} className="gg-close"></i>
            </button>
          </div>
          <div className="modal-body">
            <Component
              $global={this.$global}
              data={this.$global.ui.app.state.modalData}
            />
          </div>
        </div>
      </div>
    );
  }
}

function getModal(id) {
  switch (id) {
    case "indicators":
      return IndicatorsModal;
    case "add-data":
      return AddDataModal;
    case "dataset-group":
      return DatasetGroupModal;
  }
}
