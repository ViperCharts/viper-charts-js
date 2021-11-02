import React from "react";

import GlobalState from "../../state/global";

import IndicatorsModal from "./modals/indicators/indicators-modal";

import "./modal.css";

export default class Modal extends React.Component {
  constructor(props) {
    super(props);
  }

  close() {
    GlobalState.ui.app.setModal("");
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
              <i onClick={this.close} className="gg-close"></i>
            </button>
          </div>
          <div className="modal-body">
            <Component />
          </div>
        </div>
      </div>
    );
  }
}

function getModal(id) {
  let Modal;

  switch (id) {
    case "indicators":
      return IndicatorsModal;
  }
}