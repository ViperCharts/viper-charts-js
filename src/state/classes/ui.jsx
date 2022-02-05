import React from "react";
import ReactDOM from "react-dom";

import EventEmitter from "../../events/event_emitter";

import Modal from "../../react-components/modal/modal";
import ContextMenus from "../../react-components/context_menus/context_menus";
import Chart from "../../react-components/chart/chart";
import TopBar from "../../react-components/top-bar/top-bar";
import Grid from "../../react-components/grid/grid";

import "../../react-components/main.css";

class App extends React.Component {
  constructor(props) {
    super(props);

    this.$global = props.$global;

    this.state = {
      charts: {},
      modal: "",
      contextmenu: {
        id: "",
        pos: [0, 0],
        data: {},
      },
    };

    this.appElement = React.createRef();
    this.chartsElement = React.createRef();
    this.contextMenusElement = React.createRef();

    this.$global.ui.app = this;
    props.onReady();
  }

  addChart(chart) {
    const charts = this.state.charts;
    charts[chart.id] = chart;
    this.setState(() => (this.state.charts = charts));
  }

  setModal(modal) {
    this.setState(() => (this.state.modal = modal));
  }

  setContextMenu(e, id, data = {}) {
    console.log(e);
    e.stopPropagation();
    const pos = [e.clientX, e.clientY];

    this.setState(() => {
      this.state.contextmenu = { id, pos: [0, 0], data };
    });
    this.forceUpdate(() => {
      const { clientWidth: elWidth, clientHeight: elHeight } =
        this.contextMenusElement.current;
      const { clientWidth: appWidth, clientHeight: appHeight } =
        this.appElement.current;

      pos[0] = Math.min(pos[0], appWidth - elWidth);
      pos[1] = Math.min(pos[1], appHeight - elHeight);

      this.setState(() => {
        this.state.contextmenu.pos = pos;
      });
      this.forceUpdate();
    });
  }

  closeContextMenu() {
    this.setState(() => {
      this.state.contextmenu = { id: "", pos: [] };
    });
    this.forceUpdate();
  }

  render() {
    const { modal, contextmenu } = this.state;

    return (
      <div
        ref={this.appElement}
        className="viper"
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <link
          href="https://cdn.jsdelivr.net/npm/css.gg/icons/all.css"
          rel="stylesheet"
        />

        {modal.length ? <Modal $global={this.$global} id={modal} /> : null}
        {contextmenu.id.length ? (
          <div
            style={{
              position: "absolute",
              top: contextmenu.pos[1],
              left: contextmenu.pos[0],
              zIndex: 1000,
            }}
            ref={this.contextMenusElement}
          >
            <ContextMenus
              $global={this.$global}
              id={contextmenu.id}
              pos={contextmenu.pos}
              data={contextmenu.data}
            />
          </div>
        ) : null}

        <TopBar $global={this.$global} />
        <div ref={this.chartsElement} style={{ width: "100%", height: "100%" }}>
          <Grid $global={this.$global} charts={this.state.charts} />
        </div>
      </div>
    );
  }

  renderCharts() {
    const keys = Object.keys(this.state.charts);
    if (!keys.length) return <div></div>;
    const charts = keys.map((key) => (
      <div
        key={key}
        data-grid={{
          x: 0,
          y: 0,
          w: 12,
          h: 2,
        }}
      >
        <Chart id={key} style={{ width: "100%", height: "100%" }} />
      </div>
    ));
    return charts;
  }
}

export default class UIState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.app = undefined;
    this.charts = {};

    this.isGridEditMode = false;
  }

  init() {
    return new Promise((resolve) => {
      ReactDOM.render(
        <App $global={this.$global} onReady={resolve} />,
        this.$global.api.element
      );
    });
  }

  destroy() {
    ReactDOM.unmountComponentAtNode(this.$global.api.element);
  }

  setIsGridEditMode(value) {
    this.isGridEditMode = value;
    this.fireEvent("set-is-grid-edit-mode", value);
  }
}
