import React from "react";

export default {
  title: "Templates",
  width: 100,
  height: 100,
  component: class TemplatesModal extends React.Component {
    constructor(props) {
      super(props);

      this.$global = props.$global;

      this.state = {
        templates: [],
        isLoading: true,
      };
    }

    componentDidMount() {
      this.getTemplates();
    }

    async getTemplates() {
      this.setState({ isLoading: true });
      const templates = await this.$global.api.onRequestTemplates();
      this.setState({ templates, isLoading: false });
    }

    setTemplate(template) {
      const config = JSON.parse(
        '{"layout":[{"id":"30o8tnp423w","chartId":"c4xg42aqku8","top":0,"left":0,"width":100,"height":100,"children":[]}],"charts":{},"global":{"maxCharts":null,"gridEdit":true}}'
      );
      config.charts.c4xg42aqku8 = template.config;
      localStorage.setItem("settings", JSON.stringify(config));
      location.reload();
    }

    render() {
      return (
        <div>
          {this.state.templates.map((template, i) => (
            <div className="indicator-list-item grouped-list-item" key={i}>
              <button
                onClick={() => this.setTemplate(template)}
                style={{ width: "100%" }}
              >
                {template.name}
              </button>
            </div>
          ))}
        </div>
      );
    }
  },
};
