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
      const storage = JSON.parse(localStorage.getItem("settings"));
      const chartId = Object.keys(storage.charts)[0];
      storage.charts[chartId] = template.config;
      localStorage.setItem("settings", JSON.stringify(storage));
      location.reload();
    }

    render() {
      return (
        <div>
          {this.state.templates.map((template, i) => (
            <div className="indicator-list-item grouped-list-item" key={i}>
              <button onClick={() => this.setTemplate(template)}>
                {template.name}
              </button>
            </div>
          ))}
        </div>
      );
    }
  },
};
