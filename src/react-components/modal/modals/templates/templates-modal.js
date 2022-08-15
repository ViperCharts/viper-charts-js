import React from "react";

import "./templates-modal.css";

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
        newTemplateName: "",
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

    loadTemplate(activeTemplateId) {
      this.$global.settings.setSettings({ activeTemplateId });
      location.reload();
    }

    addTemplate() {
      const config = JSON.stringify(this.$global.settings.settings);
      this.$global.api.onSaveTemplate(this.activeTemplateId, {
        name: "My template",
        config,
      });
    }

    render() {
      return (
        <div className="templates-model">
          <div className="templates-list">
            {this.state.templates.length > 0 ? (
              this.state.templates.map((template, i) => (
                <div className="indicator-list-item grouped-list-item" key={i}>
                  <button
                    onClick={() => this.setTemplate(template)}
                    style={{ width: "100%" }}
                  >
                    {template.name}
                  </button>
                </div>
              ))
            ) : (
              <div className="no-saved-templates">
                You haven't saved any templates yet
              </div>
            )}
          </div>
          <div className="templates-add">
            <h3>Add a template</h3>
            <form onSubmit={() => this.addTemplate()}>
              <input
                type="text"
                value={this.state.newTemplateName}
                onChange={(e) =>
                  this.setState({ newTemplateName: e.target.value })
                }
                placeholder="Enter your template name..."
              />
              <button>Save Current Template</button>
            </form>
          </div>
        </div>
      );
    }
  },
};
