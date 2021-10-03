import React from "react";

import "./grid.css";

export default class Grid extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      boxes: [],
    };

    this.grid = React.createRef();

    this.addBox(0, 0);
  }

  addBox(x, y) {
    const width = this.grid.clientWidth;
    const height = this.grid.clientHeight;

    // Convert coords to perc using screen size
    const widthPercent = x / width;
    const heightPercent = y / height;

    const box = {
      top: widthPercent,
      left: heightPercent,
      width: 100,
      height: 100,
    };

    // Check if box overlaps with other boxes

    // Add box to state
    const boxes = this.state.boxes;
    boxes.push(box);
  }

  render() {
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
              background: getRandomColor(),
            }}
          >
            <div className="grid-box-controls">
              <div
                onClick={() => this.addBox()}
                className="grid-box-controls-left"
              ></div>
              <div className="grid-box-controls-top"></div>
              <div className="grid-box-controls-right"></div>
              <div className="grid-box-controls-bottom"></div>
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
