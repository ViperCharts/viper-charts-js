import EventEmitter from "../../events/event_emitter";

import PlotTypes from "../../components/plot_types";

export default class SettingsState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.layout = [];
    this.charts = {};
    this.templates = [];

    this.settings = {
      global: {
        maxCharts: Infinity,
        gridEdit: true,
      },
      activeTemplateId: 1,
    };

    this.needsToUpdate = false;

    this.checkIfNeedsToUpdateInterval = setInterval(() => {
      if (this.needsToUpdate) {
        let template = this.templates.find(
          ({ id }) => id === this.settings.activeTemplateId
        );

        template.config = {
          layout: this.layout,
          charts: this.charts,
        };
        this.$global.api.onSaveTemplate(
          this.settings.activeTemplateId,
          template
        );

        this.$global.api.onSaveViperSettings(this.settings);

        this.needsToUpdate = false;
      }
    }, 1000);
  }

  init() {}

  destroy() {
    clearInterval(this.checkIfNeedsToUpdateInterval);
  }

  setSettings(settings = {}) {
    if (settings.global === "object") {
      for (const property in settings.global) {
        this.settings.global[property] = settings.global[property];
      }
    }

    if (typeof settings.activeTemplateId === "number") {
      this.settings.activeTemplateId = settings.activeTemplateId;
    }

    this.needsToUpdate = true;
    this.loadTemplates();
  }

  async loadTemplates() {
    // Get template
    const templates = await this.$global.api.onRequestTemplates();
    if (!templates || !Array.isArray(templates)) return;

    this.templates = templates;

    let template = templates.find(
      ({ id }) => id === this.settings.activeTemplateId
    );

    if (!template) {
      template = {
        id: this.settings.activeTemplateId,
        name: "My first template",
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
      this.templates.push(template);
    }

    let { layout, charts } = template.config;

    for (const chartId in charts) {
      const state = charts[chartId];
      this.$global.createChart({
        id: chartId,
        ...state,
      });

      const chart = this.$global.charts[chartId];

      // If indicators is defined, loop through and add all indicators when initialized state
      if (typeof state.datasetGroups === "object") {
        chart.addEventListener("init", () => {
          chart.setVisibleRange(state.range);

          for (const { datasets, visible, synced, indicators } of Object.values(
            state.datasetGroups
          )) {
            const group = chart.createDatasetGroup(
              datasets,
              {
                visible,
                synced,
              },
              { updateUI: false }
            );

            for (const indicator of Object.values(indicators)) {
              chart.addIndicator(
                PlotTypes.getIndicatorById(indicator.id),
                group.id,
                indicator.model,
                {
                  visible: indicator.visible,
                  layerId: indicator.layerId,
                },
                {
                  updateUI: false,
                }
              );
            }
          }
        });
      }
    }

    this.$global.layout.setInitialLayout(layout);
  }

  onChartAdd(id, state = {}) {
    state = {
      name: "",
      timeframe: 0,
      ranges: { x: {}, y: {} },
      pixelsPerElement: 0,
      datasetGroups: {},
      settings: {},
      ...state,
    };

    this.charts[id] = state;
    this.needsToUpdate = true;
  }

  onChartChangeName(id, name) {
    const chart = this.charts[id];
    if (!chart) {
      console.error(`Chart id ${id} not found in Viper settings state`);
      return;
    }
    chart.name = name;

    this.needsToUpdate = true;
  }

  onChartChangeRangeOrTimeframe(id, { ranges, timeframe, pixelsPerElement }) {
    const chart = this.charts[id];
    if (!chart) {
      console.error(`Chart id ${id} not found in Viper settings state`);
      return;
    }
    if (ranges) {
      for (const id in ranges.y) {
        ranges.y[id].indicators = {};
      }
      chart.ranges = ranges;
    }
    if (timeframe) chart.timeframe = timeframe;
    if (pixelsPerElement) chart.pixelsPerElement = pixelsPerElement;

    this.needsToUpdate = true;
  }

  onChartDatasetGroupsChange(id, datasetGroups) {
    const chart = this.charts[id];
    if (!chart) {
      console.error(`Chart id ${id} not found in Viper settings state`);
      return;
    }

    datasetGroups = JSON.parse(JSON.stringify(datasetGroups));
    for (const id in datasetGroups) {
      const group = datasetGroups[id];

      for (const id in group.indicators) {
        delete group.indicators[id].draw;
      }
    }

    chart.datasetGroups = datasetGroups;

    this.needsToUpdate = true;
  }

  onChartChangeSettings(id, settings) {
    const chart = this.charts[id];
    if (!chart) {
      console.error(`Chart id ${id} not found in Viper settings state`);
      return;
    }
    chart.settings = settings;

    this.needsToUpdate = true;
  }

  onChartDelete(id) {
    delete this.charts[id];

    this.needsToUpdate = true;
  }

  onSetLayout(layout) {
    this.layout = layout;

    this.needsToUpdate = true;
  }

  onDeleteTemplate(templateId) {
    const i = this.templates.findIndex(({ id }) => id === templateId);
    this.templates.splice(i, 1);
    this.$global.api.onDeleteTemplate(templateId);
  }
}
