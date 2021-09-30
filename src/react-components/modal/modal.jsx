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

    return (
      <div className="modal-container">
        <div className="modal">
          <div className="modal-top">
            <h1>{id}</h1>
            <button>
              <i onClick={this.close} className="gg-close"></i>
            </button>
          </div>
          <div className="modal-body">{modal ? modal : ""}</div>
        </div>
      </div>
    );
  }
}

function getModal(id) {
  switch (id) {
    case "indicators":
      return <IndicatorsModal />;
  }
}
