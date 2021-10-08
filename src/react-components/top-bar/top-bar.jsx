import React from "react";

import GlobalState from "../../state/global";

import "./top-bar.css";

export default class TopBar extends React.Component {
  constructor(props) {
    super(props);
  }

  showIndicatorsModal() {
    GlobalState.ui.app.setModal("indicators");
  }

  render() {
    const { isGridEditMode } = GlobalState.ui.state;

    return (
      <div className="top-bar">
        <button className="top-bar-item">🐍</button>
        <button onClick={this.showIndicatorsModal} className="top-bar-item">
          Indicators
        </button>
        <div className="top-bar-seperator"></div>
        <button
          onClick={() =>
            GlobalState.ui.setState({ isGridEditMode: !isGridEditMode })
          }
          className="top-bar-item"
        >
          <i className="gg-display-grid"></i>
          {!isGridEditMode ? "Grid Locked" : "Grid Edit"}
        </button>
      </div>
    );
  }
}
