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
          layout: [
            {
              id: "dxzu2xbsy2",
              top: 0,
              left: 0,
              width: 100,
              height: 100,
              children: [],
              chartId: "fupc7matbzp",
            },
          ],
          charts: {
            fupc7matbzp: {
              name: "",
              timeframe: 3.6e6,
              ranges: {
                x: {},
                y: {},
              },
              pixelsPerElement: 10,
              datasetGroups: {},
              settings: {
                syncRange: false,
                syncWithCrosshair: "",
              },
            },
          },
        },
      };

      template = await this.$global.api.onSaveTemplate(-1, template);

      // Update active template id
      this.$global.settings.templates.push(template);
      this.$global.settings.setSettings({ activeTemplateId: template.id });

      this.setState({
        tempaltes: this.$global.settings.templates,
        activeTemplateId: this.$global.settings.settings.activeTemplateId,
        newTemplateName: "",
      });

      this.$global.api.onSaveViperSettings({
        ...this.$global.api.settings,
        activeTemplateId: template.id,
      });
      location.reload();
    }

    async deleteTemplate(id) {
      this.$global.settings.onDeleteTemplate(id);
      this.setState({
        templates: this.$global.settings.templates,
      });
    }

    render() {
      return (
        <div className="templates-model">
          <div className="templates-list">
            {this.state.templates.length > 0 ? (
              this.state.templates.map((template, i) => (
                <div
                  className="indicator-list-item grouped-list-item"
                  style={{ display: "flex" }}
                  key={template.id}
                >
                  <button
                    onClick={() => this.loadTemplate(template.id)}
                    className="add-indicator-btn-main"
                  >
                    {template.name}
                    {this.state.activeTemplateId === template.id && (
                      <i> (Selected)</i>
                    )}
                  </button>
                  <button
                    disabled={this.state.activeTemplateId === template.id}
                    onClick={() => this.deleteTemplate(template.id)}
                    title="You can't delete a template when it's selected"
                  >
                    Delete
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
