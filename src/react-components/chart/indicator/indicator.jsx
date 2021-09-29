import React from "react";

import "./indicator.css";

export default class Indicator extends React.Component {
  constructor(props) {
    super(props);
    console.log(props);
  }

  toggleVisibility() {}

  remove() {}

  render() {
    const { indicator } = this.props;

    return (
      <div
        className={`indicator v-noselect ${
          indicator.visible ? "" : "invisible"
        }`}
      >
        <span className="indicator-title">{indicator.name}</span>
        <button onClick={this.toggleVisibility}>
          {indicator.visible ? (
            <i className="gg-eye"></i>
          ) : (
            <i className="gg-eye-alt"></i>
          )}
        </button>
        <button onClick={this.remove}>
          <i className="gg-close"></i>
        </button>
      </div>
    );
  }
}
