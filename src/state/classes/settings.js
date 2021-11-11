import EventEmitter from "../../events/event_emitter";

import Indicators from "../../components/indicators";

export default class SettingsState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.settings = {
      layout: [],
      charts: {},
    };
  }

  init() {}

  parseInitialSettings(settings) {
    let layout = [];

    if (settings.layout instanceof Array) {
      layout = settings.layout;

      if (typeof settings.charts === "object") {
        for (const chartId in settings.charts) {
          const state = settings.charts[chartId];
          this.$global.createChart({
            id: chartId,
            ...state,
          });

          const chart = this.$global.charts[chartId];

          // If indicators is defined, loop through and add all indicators when initialized state
          if (typeof state.indicators === "object") {
            chart.addEventListener("init", () => {
              chart.setVisibleRange(state.range);

              for (const indicator of Object.values(state.indicators)) {
                const [source, name] = indicator.datasetId.split(":");
                chart.addIndicator(Indicators.map.get(indicator.id), {
                  source,
                  name,
                  visible: indicator.visible,
                });
              }
            });
          }
        }
      }
    }

    this.$global.layout.setInitialLayout(layout);
  }

  onChartAdd(id, state = {}) {
    state = {
      timeframe: 0,
      range: [0, 0],
      pixelsPerElement: 0,
      indicators: [],
      settings: {},
      ...state,
    };

    this.settings.charts[id] = state;
    this.$global.api.onSaveViperSettings(this.settings);
  }

  onChartChangeRangeOrTimeframe(id, { range, timeframe, pixelsPerElement }) {
    const chart = this.settings.charts[id];
    if (!chart) {
      console.error(`Chart id ${id} not found in Viper settings state`);
      return;
    }
    if (range) chart.range = range;
    if (timeframe) chart.timeframe = timeframe;
    if (pixelsPerElement) chart.pixelsPerElement = pixelsPerElement;
    this.$global.api.onSaveViperSettings(this.settings);
  }

  onChartIndicatorsChange(id, indicators) {
    const chart = this.settings.charts[id];
    if (!chart) {
      console.error(`Chart id ${id} not found in Viper settings state`);
      return;
    }
    chart.indicators = indicators;
    this.$global.api.onSaveViperSettings(this.settings);
  }

  onChartChangeSettings(id, settings) {
    const chart = this.settings.charts[id];
    if (!chart) {
      console.error(`Chart id ${id} not found in Viper settings state`);
      return;
    }
    chart.settings = settings;
    this.$global.api.onSaveViperSettings(this.settings);
  }

  onChartDelete(id) {
    delete this.settings.charts[id];
    this.$global.api.onSaveViperSettings(this.settings);
  }

  onSetLayout(layout) {
    this.settings.layout = layout;
    this.$global.api.onSaveViperSettings(this.settings);
  }
}
