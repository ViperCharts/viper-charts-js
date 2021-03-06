import React from "react";

import AddDataModal from "./modals/add-data/add-data";
import IndicatorsModal from "./modals/indicators/indicators-modal";
import DatasetGroupModal from "./modals/dataset-group/dataset-group";
import ChangeDatasetModal from "./modals/dataset-group/change-dataset";
import TemplatesModal from "./modals/templates/templates-modal";

import "./modal.css";

export default class Modal extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;
    this.modalRef = React.createRef();
  }

  componentDidMount() {
    setTimeout(() => {
      const input = this.modalRef.current.querySelector("input");
      if (input) input.focus();
    }, 1);
  }

  close() {
    this.$global.ui.app.setModal("");
  }

  render() {
    const { id } = this.props;

    let modal = getModal(id);
    const { title, component: Component, height = 0, width = 0 } = modal;

    return (
      <div className="modal-container" ref={this.modalRef}>
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
    case "change-dataset":
      return ChangeDatasetModal;
    case "templates":
      return TemplatesModal;
  }
}
