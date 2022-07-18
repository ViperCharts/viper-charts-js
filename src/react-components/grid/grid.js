import React from "react";

import Chart from "../chart/chart";

import Utils from "../../utils";

import "./grid.css";

export default class Grid extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.state = {
      boxes: [],
      layout: [],

      showAddChartHooks: false,
      breakpointResizingBox: undefined,
    };

    this.grid = React.createRef();
    this.boxRefs = {};

    this.setLayoutListener = this.onSetLayout.bind(this);
    this.$global.layout.addEventListener("set-layout", this.setLayoutListener);

    this.onSetIsGridEditMode = (() => this.forceUpdate()).bind(this);
    this.$global.ui.addEventListener(
      "set-is-grid-edit-mode",
      this.onSetIsGridEditMode
    );

    this.mouseUpListener = (() =>
      (this.breakpointResizingBox = undefined)).bind(this);
    this.$global.events.addEventListener("mouseup", this.mouseUpListener);
  }

  componentWillUnmount() {
    this.$global.layout.removeEventListener(
      "set-layout",
      this.setLayoutListener
    );
    this.$global.events.removeEventListener("mouseup", this.mouseUpListener);
    this.$global.ui.removeEventListener(
      "set-is-grid-edit-mode",
      this.onSetIsGridEditMode
    );
  }

  onSetLayout(layout) {
    const loop = (children) => {
      for (let child of children) {
        // For each child, do this
        this.boxRefs[child.id] = React.createRef();

        if (child.children.length) {
          loop(child.children);
        }
      }
      return children;
    };

    this.setState({ boxes: loop(layout) });
  }

  addBoxToSide(boxId, side) {
    const chart = this.$global.charts[this.$global.selectedChartId];

    const { box2 } = this.$global.layout.addChartBoxToSide(boxId, side, 50, {
      timeframe: chart.timeframe,
      range: chart.range,
      pixelsPerElement: chart.pixelsPerElement,
    });
    this.boxRefs[box2.id] = React.createRef();
  }

  onClickBreakpoint(box) {
    this.breakpointResizingBox = box;
  }

  // TODO convert to on mouse move capture to get child elements
  onMouseMove({ movementX, movementY }) {
    if (!this.breakpointResizingBox) return;
    const [box1, box2] = this.breakpointResizingBox.children;

    // If horizontal
    if (box1.side === "left") {
      let width1 = this.boxRefs[box1.id].current.clientWidth;
      let width2 = this.boxRefs[box2.id].current.clientWidth;
      const width = width1 + width2;

      if (movementX < 0) {
        width1 += movementX;
        width2 -= movementX;
      } else if (movementX > 0) {
        width1 += movementX;
        width2 -= movementX;
      }

      const wperc1 = (width1 / width) * 100;

      this.breakpointResizingBox.children = [
        {
          ...box1,
          width: wperc1,
        },
        {
          ...box2,
          left: wperc1,
          width: (width2 / width) * 100,
        },
      ];
    }

    // If vertical
    else {
      let height1 = this.boxRefs[box1.id].current.clientHeight;
      let height2 = this.boxRefs[box2.id].current.clientHeight;
      const height = height1 + height2;

      if (movementY < 0) {
        height1 += movementY;
        height2 -= movementY;
      } else if (movementY > 0) {
        height1 += movementY;
        height2 -= movementY;
      }

      const hperc1 = (height1 / height) * 100;

      this.breakpointResizingBox.children = [
        {
          ...box1,
          height: hperc1,
        },
        {
          ...box2,
          top: hperc1,
          height: (height2 / height) * 100,
        },
      ];
    }

    this.forceUpdate();
  }

  render() {
    const chartKeys = Object.keys(this.props.charts);
    if (!chartKeys.length) return <div></div>;

    return (
      <div
        ref={this.grid}
        onMouseMove={this.onMouseMove.bind(this)}
        className="grid"
      >
        {this.state.boxes.map(this.renderBox.bind(this))}
      </div>
    );
  }

  renderBox(box, i) {
    return (
      <div
        className="grid-box"
        ref={this.boxRefs[box.id]}
        key={box.id}
        style={{
          top: `${box.top}%`,
          left: `${box.left}%`,
          width: `${box.width}%`,
          height: `${box.height}%`,
        }}
      >
        {this.$global.ui.isGridEditMode && !box.children.length ? (
          <div className="grid-box-controls">
            <div
              onClick={() => this.addBoxToSide(box.id, "left")}
              className="grid-box-controls-left"
            ></div>
            <div
              onClick={() => this.addBoxToSide(box.id, "top")}
              className="grid-box-controls-top"
            ></div>
            <div
              onClick={() => this.addBoxToSide(box.id, "right")}
              className="grid-box-controls-right"
            ></div>
            <div
              onClick={() => this.addBoxToSide(box.id, "bottom")}
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
              <div style={{ width: "100%", height: "100%" }}>
                <Chart $global={this.$global} id={box.chartId} />
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
    const [box1] = box.children;

    const bp = {
      top: 0,
      left: 0,
      width: 0,
      height: 0,
      cursor: "",
    };

    if (box1.side === "left") {
      bp.left = box1.width;
      bp.height = box1.height;
      bp.cursor = "ew-resize";
    } else if (box1.side === "top") {
      bp.top = box1.height;
      bp.width = box1.width;
      bp.cursor = "ns-resize";
    }

    return (
      <div
        className="grid-breakpoint"
        onMouseDown={() => this.onClickBreakpoint(box)}
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
