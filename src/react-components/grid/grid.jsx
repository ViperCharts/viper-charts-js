import React from "react";

import GlobalState from "../../state/global";

import Chart from "../../react-components/chart/chart";

import "./grid.css";

export default class Grid extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      boxes: [
        {
          top: 0,
          left: 0,
          width: 100,
          height: 100,
        },
      ],
    };

    this.grid = React.createRef();
  }

  addBoxToSide(index, side) {
    let box = this.state.boxes[index];
    let newBox = { ...box };

    if (side === "left") {
      const w = box.width / 2;
      newBox.width = w;
      box.left = box.left + w;
      box.width = w;
    }

    if (side === "top") {
      const h = box.height / 2;
      newBox.height = h;
      box.top = box.top + h;
      box.height = h;
    }

    if (side === "right") {
      const w = box.width / 2;
      newBox.left = box.left + w;
      newBox.width = w;
      box.width = w;
    }

    if (side === "bottom") {
      const h = box.height / 2;
      newBox.height = h;
      newBox.top = box.top + h;
      box.height = h;
    }

    const { boxes } = this.state;
    boxes[index] = box;
    boxes.push(newBox);

    this.setState(() => (this.state.boxes = boxes));
    GlobalState.createChart();
  }

  render() {
    const chartKeys = Object.keys(this.props.charts);
    if (!chartKeys.length) return <div></div>;

    return (
      <div ref={this.grid} className="grid">
        {this.state.boxes.map((box, i) => (
          <div
            className="grid-box"
            key={i}
            style={{
              top: `${box.top}%`,
              left: `${box.left}%`,
              width: `${box.width}%`,
              height: `${box.height}%`,
            }}
          >
            <div className="grid-box-controls">
              <div
                onClick={() => this.addBoxToSide(i, "left")}
                className="grid-box-controls-left"
              ></div>
              <div
                onClick={() => this.addBoxToSide(i, "top")}
                className="grid-box-controls-top"
              ></div>
              <div
                onClick={() => this.addBoxToSide(i, "right")}
                className="grid-box-controls-right"
              ></div>
              <div
                onClick={() => this.addBoxToSide(i, "bottom")}
                className="grid-box-controls-bottom"
              ></div>
            </div>

            <div
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
              }}
            >
              <Chart
                id={chartKeys[i]}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }
}

function getRandomColor() {
  var letters = "0123456789ABCDEF";
  var color = "#";
  for (var i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
