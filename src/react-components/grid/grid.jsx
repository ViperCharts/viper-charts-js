import React from "react";

import GlobalState from "../../state/global";

import Chart from "../../react-components/chart/chart";

import Utils from "../../utils";

import "./grid.css";

export default class Grid extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      boxes: [],
    };

    this.grid = React.createRef();

    GlobalState.layout.addEventListener(
      "set-layout",
      this.onSetLayout.bind(this)
    );
  }

  onSetLayout(layout) {
    this.setState({ boxes: layout });
  }

  addBoxToSide(box, side) {
    const oldBox = {
      id: Utils.uniqueId(),
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      children: [],
      chartId: box.chartId,
    };
    const newBox = {
      id: Utils.uniqueId(),
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      children: [],
    };
    delete box.chartId;

    if (side === "left") {
      oldBox.left = 50;
      oldBox.width = 50;
      newBox.width = 50;
    }

    if (side === "top") {
      oldBox.top = 50;
      oldBox.height = 50;
      newBox.height = 50;
    }

    if (side === "right") {
      newBox.left = 50;
      oldBox.width = 50;
      newBox.width = 50;
    }

    if (side === "bottom") {
      newBox.top = 50;
      oldBox.height = 50;
      newBox.height = 50;
    }

    const { id } = GlobalState.createChart();
    newBox.chartId = id;

    const { boxes } = this.state;
    box.children = [oldBox, newBox];
    GlobalState.layout.setLayout(boxes);
  }

  render() {
    const chartKeys = Object.keys(this.props.charts);
    if (!chartKeys.length) return <div></div>;

    return (
      <div ref={this.grid} className="grid">
        {this.state.boxes.map(this.renderBox.bind(this))}
      </div>
    );
  }

  renderBox(box) {
    return (
      <div
        className="grid-box"
        key={box.id}
        style={{
          top: `${box.top}%`,
          left: `${box.left}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
        }}
      >
        <div className="grid-box-controls">
          <div
            onClick={() => this.addBoxToSide(box, "left")}
            className="grid-box-controls-left"
          ></div>
          <div
            onClick={() => this.addBoxToSide(box, "top")}
            className="grid-box-controls-top"
          ></div>
          <div
            onClick={() => this.addBoxToSide(box, "right")}
            className="grid-box-controls-right"
          ></div>
          <div
            onClick={() => this.addBoxToSide(box, "bottom")}
            className="grid-box-controls-bottom"
          ></div>
        </div>

        {box.children.length ? (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }}
          >
            <div className="grid">
              {box.children.map(this.renderBox.bind(this))}
            </div>
          </div>
        ) : (
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "100%",
              height: "100%",
            }}
          >
            <Chart id={box.chartId} style={{ width: "100%", height: "100%" }} />
          </div>
        )}
      </div>
    );
  }
}
