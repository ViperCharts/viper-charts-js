import React from "react";

import "./indicator.css";

export default class Indicator extends React.Component {
  constructor(props) {
    super(props);
  }

  toggleVisibility() {}

  remove() {}

  render() {
    const { indicator } = this.props;
    const v = indicator.visible;

    return (
      <div className={`indicator v-noselect ${v ? "" : "invisible"}`}>
        <span className="indicator-title">{indicator.name}</span>
        <button onClick={this.toggleVisibility}>
          {v ? <i className="gg-eye"></i> : <i className="gg-eye-alt"></i>}
        </button>
        <button onClick={this.remove}>
          <i className="gg-close"></i>
        </button>
      </div>
    );
  }
}
