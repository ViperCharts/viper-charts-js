import React from "react";

import GlobalState from "../../state/global";

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

    return (
      <div className="modal-container">
        <div className="modal">
          <div className="modal-top">
            <h1>{id}</h1>
            <button>
              <i onClick={this.close} className="gg-close"></i>
            </button>
          </div>
          <div className="modal-body"></div>
        </div>
      </div>
    );
  }
}
