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

      showAddChartHooks: false,
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
      side: box.side,
      id: Utils.uniqueId(),
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      chartId: box.chartId,
      children: [],
    };
    const newBox = {
      side,
      id: Utils.uniqueId(),
      top: 0,
      left: 0,
      width: 100,
      height: 100,
      children: [],
    };

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
    delete box.chartId;

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

  renderBox(box, i) {
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
        {GlobalState.ui.state.isGridEditMode ? (
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
        ) : null}

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
            {box.chartId ? (
              <div style={{ padding: "2px", width: "100%", height: "100%" }}>
                <Chart id={box.chartId} />
              </div>
            ) : null}
            {box.children.length ? this.renderBreakpoint(box) : null}
            {box.children.map(this.renderBox.bind(this))}
          </div>
        </div>
      </div>
    );
  }

  renderBreakpoint(box) {
    const parent = box.children[0];
    const child = box.children[1];

    const bp = {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      cursor: "",
    };

    if (child.side === "right") {
      bp.left = child.width;
      bp.height = child.height;
      bp.cursor = "ew-resize";
    } else if (child.side === "bottom") {
      bp.top = parent.height;
      bp.width = child.width;
      bp.cursor = "ns-resize";
    } else if (child.side === "left") {
      bp.left = child.width;
      bp.height = child.height;
      bp.cursor = "ew-resize";
    } else if (child.side === "top") {
      bp.top = child.height;
      bp.width = child.width;
      bp.cursor = "ns-resize";
    }

    return (
      <div
        className="grid-breakpoint"
        style={{
          top: `calc(${bp.top}% - 2px)`,
          left: `calc(${bp.left}% - 2px)`,
          width: bp.width > 0 ? `${bp.width}%` : "4px",
          height: bp.height > 0 ? `${bp.height}%` : "4px",
          cursor: bp.cursor,
        }}
      ></div>
    );
  }
}
