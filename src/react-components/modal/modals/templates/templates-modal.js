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
        templates: this.$global.settings.templates,
        activeTemplateId: this.$global.settings.settings.activeTemplateId,
        isLoading: true,
        newTemplateName: "",
      };
    }

    loadTemplate(activeTemplateId) {
      this.$global.api.onSaveViperSettings({
        ...this.$global.api.settings,
        activeTemplateId,
      });
      location.reload();
    }

    async addTemplate(e) {
      e.preventDefault();

      // Add to templates array
      let template = {
        id: -1,
        name: this.state.newTemplateName,
        config: {
          layout: this.$global.settings.layout,
          charts: this.$global.settings.charts,
        },
      };

      template = await this.$global.api.onSaveTemplate(-1, template);

      console.log(template);

      // Update active template id
      this.$global.settings.templates.push(template);
      this.$global.settings.setSettings({ activeTemplateId: template.id });

      this.setState({
        tempaltes: this.$global.settings.templates,
        activeTemplateId: this.$global.settings.settings.activeTemplateId,
        newTemplateName: "",
      });
    }

    render() {
      console.log(this.state.templates[0], this.state.activeTemplateId);

      return (
        <div className="templates-model">
          <div className="templates-list">
            {this.state.templates.length > 0 ? (
              this.state.templates.map((template, i) => (
                <div className="indicator-list-item grouped-list-item" key={i}>
                  <button
                    onClick={() => this.loadTemplate(template.id)}
                    style={{ width: "100%" }}
                  >
                    {template.name}
                    {template.id === this.state.activeTemplateId &&
                      " (Selected)"}
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
            <h3>Create New Template From Scratch</h3>
            <form onSubmit={this.addTemplate.bind(this)}>
              <input
                type="text"
                value={this.state.newTemplateName}
                onChange={(e) =>
                  this.setState({ newTemplateName: e.target.value })
                }
                placeholder="Enter your template name..."
              />
              <button>Create</button>
            </form>
          </div>
        </div>
      );
    }
  },
};
