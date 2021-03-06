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
      modalData: {},
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
    this.setState({ charts: { ...this.state.charts, [chart.id]: chart } });
  }

  setModal(modal, modalData = {}) {
    this.setState({ modal, modalData });
  }

  setContextMenu(e, id, data = {}) {
    e.stopPropagation();
    e.preventDefault();
    let pos = [0, 0];

    this.setState({ contextmenu: { id, pos, data } }, () => {
      const elWidth = this.contextMenusElement.current.clientWidth;
      const elHeight = this.contextMenusElement.current.clientHeight;
      const appWidth = this.appElement.current.clientWidth;
      const appHeight = this.appElement.current.clientHeight;

      pos[0] = Math.min(e.clientX, appWidth - elWidth);
      pos[1] = Math.min(e.clientY, appHeight - elHeight);

      this.setState({ contextmenu: { id, pos, data } });
    });
  }

  closeContextMenu() {
    this.setState({ contextmenu: { id: "", pos: [], data: {} } });
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
        <div
          style={{
            position: "absolute",
            top: contextmenu.pos[1],
            left: contextmenu.pos[0],
            zIndex: 1000,
            visibility: this.state.contextmenu.id.length ? "visible" : "none",
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
