import Constants from "../../constants.js";

import Utils from "../../utils.js";

import Indicators from "../../components/indicators.js";

import Main from "../../components/canvas_components/main.js";
import TimeScale from "../../components/canvas_components/time_scale.js";
import PriceScale from "../../components/canvas_components/price_scale.js";

import EventEmitter from "../../events/event_emitter";
import Instructions from "../../models/instructions.js";

import _ from "lodash";

export default class ChartState extends EventEmitter {
  constructor({
    $global,
    id = Utils.uniqueId(),
    name = "",
    range = {},
    pixelsPerElement = 10,
    timeframe = Constants.HOUR,
    settings = {},
  }) {
    super();

    this.$global = $global;
    this.isInitialized = false;

    this.id = id;
    this.timeframe = 0;
    this.datasets = {};
    this.datasetGroups = {};
    this.range = range;
    this.renderedRange = range;
    this.maxDecimalPlaces = 0;
    this.instructions = Instructions;
    this.computedState = this.$global.workers.createComputedState(this);
    this.subcharts = {
      main: undefined,
      xScale: undefined,
      yScale: undefined,
    };
    this.settings = {
      syncRange: false,
      syncWithCrosshair: "",
      lockedYScale: true,
      scaleType: "default",
      ...settings,
    };

    this.$global.settings.onChartAdd(this.id, {
      settings: this.settings,
    });

    this.setPixelsPerElement(pixelsPerElement);
    this.setTimeframe(timeframe);
    this.setName(name);
  }

  init() {
    if (this.isInitialized) return;

    this.onResizeListener = (({ main }) => {
      this.resizeXRange(0, main.width);
    }).bind(this);
    this.$global.layout.addEventListener(
      `resize-${this.id}`,
      this.onResizeListener
    );

    const $state = {
      chart: this,
      global: this.$global,
      dimensions: this.$global.layout.chartDimensions[this.id],
    };

    // Add crosshair to crosshair state in prep for chart to be rendered
    this.$global.crosshair.addCrosshair(this.id);

    this.subcharts = {
      main: new Main({ $state }),
      xScale: new TimeScale({ $state }),
      yScale: new PriceScale({ $state }),
    };

    this.setInitialVisibleRange();

    this.subcharts.main.init();
    this.subcharts.xScale.init();
    this.subcharts.yScale.init();

    this.isInitialized = true;

    this.fireEvent("init");
  }

  destroy() {
    this.$global.removeEventListener(
      `resize-${this.id}`,
      this.onResizeListener
    );

    // Delete subcharts
    this.subcharts.main.destroy();
    this.subcharts.yScale.destroy();
    this.subcharts.xScale.destroy();

    // Delete all dataset groups and their corresponding indicators
    // Object.keys(this.datasetGroups).map(this.removeIndicator.bind(this));

    // Delete from layout
    this.$global.layout.removeChart(this.id);

    // Delete from viper settings store
    this.$global.settings.onChartDelete(this.id);

    // Delete from global state
    delete this.$global.charts[this.id];
  }

  /**
   * Set chart name
   * @param {string} name New chart name
   */
  setName(name = "") {
    // Check if a chart already exists with that name
    for (const chart of Object.values(this.$global.charts)) {
      if (chart.name === name) {
        return { error: "A chart with that name already exists." };
      }
    }

    this.name = name;

    // Update name in Viper settings state
    this.$global.settings.onChartChangeName(this.id, name);

    // Call all subscribers to name change event
    this.fireEvent("set-name", this.name);
  }

  /**
   * Create new dataset group
   * @param {Array} datasets Array of dataset sources and names
   * @param {*} options
   */
  createDatasetGroup(datasets, { visible = true, synced = {} }) {
    const id = Utils.uniqueId();

    // Get all the datasets
    datasets.map(({ source, name }) =>
      this.$global.data.addOrGetDataset({
        source,
        name,
        timeframe: this.timeframe,
      })
    );

    this.datasetGroups[id] = {
      id,
      visible,
      datasets,
      indicators: {},
      synced,
    };

    // Update chart UI
    this.$global.ui.charts[this.id].updateDatasetGroups(this.datasetGroups);

    return this.datasetGroups[id];
  }

  /**
   * Add an indicator to this chart by id or by object
   * @param {string|indicator} indicator The indicator to add
   * @param {*} options
   */
  async addIndicator(indicator, datasetGroupId, { visible = true }) {
    if (typeof indicator === "string") {
      indicator = Indicators[indicator];
    }

    // Get the dataset group
    const group = this.datasetGroups[datasetGroupId];
    const { source, name } = group.datasets[0];

    // Get or create dataset if doesn't exist
    const dataset = this.$global.data.addOrGetDataset({
      source,
      name,
      timeframe: this.timeframe,
    });

    const localId = dataset.getTimeframeAgnosticId();
    const color = Utils.randomHexColor();

    // Add additional required options to indicator
    indicator = {
      ...indicator,
      visible,
      datasetId: localId,
      color,
    };

    // Add to the rendering queue on computed state and rendering engine
    // NOTE: draw is set to undefined here because you cannot pass
    const { renderingQueueId } = await this.computedState.addToQueue({
      indicator: {
        ...indicator,
        draw: undefined,
      },
    });

    indicator.renderingQueueId = renderingQueueId;

    // If dataset already exists, get all times and calculate them
    const timestamps = Object.keys(dataset.data);
    if (timestamps.length) {
      this.computedState.calculateOneSet({
        renderingQueueId,
        timestamps,
        dataset: {
          source: dataset.source,
          name: dataset.name,
          timeframe: dataset.timeframe,
          data: dataset.data,
        },
      });
    }

    // Subscribe to dataset updates
    dataset.addSubscriber(this.id, renderingQueueId);
    this.datasets[localId] = dataset;

    group.indicators[renderingQueueId] = indicator;
    this.datasetGroups[group.id] = group;

    // Update chart UI
    this.$global.ui.charts[this.id].updateDatasetGroups(this.datasetGroups);

    // Request data points for dataset
    this.$global.data.requestDataPoints({
      dataset,
      start: this.range.start,
      end: this.range.end,
    });

    this.$global.settings.onChartDatasetGroupsChange(
      this.id,
      this.datasetGroups
    );

    // If first new dataset, reset range according to data
    this.setInitialVisibleRange();
  }

  setTimeframe(timeframe, movedId = this.id) {
    const oldDatasets = {};

    // Copy all datasets so we can reset master in preperation for setting new visible range
    for (const oldDataset of Object.values(this.datasets)) {
      oldDatasets[oldDataset.getTimeframeAgnosticId()] = oldDataset;
    }

    // Now that we have unsubscribed from datasets, and emptied the local dataset array
    // We can reset to initial default range
    this.datasets = {};
    this.timeframe = timeframe;
    this.fireEvent("set-timeframe", timeframe);

    // Clear all computed indicator results
    this.computedState.emptyAllSets();

    if (this.isInitialized) {
      // Update range.start to be same pixelsPerElement calculation
      const { width } = this.$global.layout.chartDimensions[this.id].main;
      this.range.start =
        this.range.end - timeframe * (width / this.pixelsPerElement);

      this.setInitialVisibleRange();
    }

    // Create new datasets based on old dataset values
    for (const oldDataset of Object.values(oldDatasets)) {
      // Create or fetch dataset for new timeframe
      const dataset = this.$global.data.addOrGetDataset({
        source: oldDataset.source,
        name: oldDataset.name,
        timeframe,
      });

      // Re-instantiate all subscribers
      const subscribers = [...oldDataset.subscribers[this.id]];
      for (const renderingQueueId of subscribers) {
        dataset.addSubscriber(this.id, renderingQueueId);
        oldDataset.removeSubscriber(this.id, renderingQueueId);
      }

      this.datasets[dataset.getTimeframeAgnosticId()] = dataset;

      this.$global.data.requestDataPoints({
        dataset,
        start: this.range.start,
        end: this.range.end,
      });
    }

    // Update any synced charts to share timeframe
    if (this.settings.syncRange && movedId === this.id) {
      for (const chartId in this.$global.charts) {
        const chart = this.$global.charts[chartId];

        // If chart is in sync mode and timeframes dont match
        if (chart.settings.syncRange && chart.timeframe !== this.timeframe) {
          // Sync timeframe
          chart.setTimeframe(this.timeframe, this.id);
        }
      }
    }

    this.$global.settings.onChartChangeRangeOrTimeframe(this.id, { timeframe });
  }

  /**
   * Toggle all indicators in a dataset
   * @param {string} datasetGroupId
   */
  toggleDatasetGroupVisibility(datasetGroupId) {
    const group = this.datasetGroups[datasetGroupId];

    // Toggle datasetGroup visibility and then apply the value to all indicators in group
    group.visible = !group.visible;
    this.datasetGroups[group.id] = group;

    // Update chart UI
    this.$global.ui.charts[this.id].updateDatasetGroups(this.datasetGroups);

    Object.keys(group.indicators).forEach((id) => {
      this.toggleIndicatorVisibility(group.id, id, group.visible);
    });
  }

  toggleIndicatorVisibility(datasetGroupId, renderingQueueId, visible) {
    // Get the dataset group
    const group = this.datasetGroups[datasetGroupId];
    const indicator = group.indicators[renderingQueueId];

    indicator.visible = visible === undefined ? !indicator.visible : visible;
    this.computedState.setVisibility({
      renderingQueueId,
      visible: indicator.visible,
    });

    group.indicators[renderingQueueId] = indicator;

    // Update chart UI
    this.$global.ui.charts[this.id].updateDatasetGroups(this.datasetGroups);

    this.$global.settings.onChartDatasetGroupsChange(
      this.id,
      this.datasetGroups
    );

    if (indicator.visible) {
      const dataset = this.datasets[indicator.datasetId];
      const timestamps = Object.keys(dataset.data);

      // If dataset already exists, get all times and calculate them
      if (timestamps.length) {
        this.computedState.calculateOneSet({
          renderingQueueId,
          timestamps,
          dataset: {
            source: dataset.source,
            name: dataset.name,
            timeframe: dataset.timeframe,
            data: dataset.data,
          },
        });
      }
    }
  }

  /**
   * Remove dataset group and all child indicators
   * @param {string} datasetGroupId
   */
  removeDatasetGroup(datasetGroupId) {
    Object.keys(this.datasetGroups[datasetGroupId].indicators).forEach((id) => {
      this.removeIndicator(datasetGroupId, id);
    });
    delete this.datasetGroups[datasetGroupId];

    // Update chart UI
    this.$global.ui.charts[this.id].updateDatasetGroups(this.datasetGroups);

    // Update settings store
    this.$global.settings.onChartDatasetGroupsChange(
      this.id,
      this.datasetGroups
    );
  }

  /**
   * Remove indicator from dataset and from all other references
   * @param {string} datsetGroupId
   * @param {string} renderingQueueId
   */
  removeIndicator(datsetGroupId, renderingQueueId) {
    // Get the dataset group
    const group = this.datasetGroups[datsetGroupId];
    const indicator = group.indicators[renderingQueueId];

    this.computedState.removeFromQueue({ renderingQueueId });
    delete group.indicators[renderingQueueId];

    // Remove dataset listener and dataset if no more listeners;
    const dataset = this.datasets[indicator.datasetId];
    const subscribers = dataset.removeSubscriber(this.id, renderingQueueId);
    if (!subscribers.length) {
      delete this.datasets[dataset.getTimeframeAgnosticId()];
    }

    this.$global.ui.charts[this.id].updateDatasetGroups(this.datasetGroups);

    this.$global.settings.onChartDatasetGroupsChange(
      this.id,
      this.datasetGroups
    );
  }

  /**
   * Set the visible range of the chart
   * @param {object} newRange Visible range boundaries
   * @param {number} newRange.start Start unix timestamp for time axis
   * @param {number} newRange.end End unix timestamp for time axis
   * @param {number} newRange.min Min value for price axis
   * @param {number} newRange.max Max value for price axis
   * @param {string} movedId The chart id of the chart that initialzed the move
   */
  async setVisibleRange(newRange = {}, movedId = this.id) {
    const {
      start = this.range.start,
      end = this.range.end,
      min = this.range.min,
      max = this.range.max,
    } = newRange;

    this.range = { start, end, min, max };

    // If this chart is in synced mode and other charts are also in sync mode,
    // set their scales to ours
    if (this.settings.syncRange && movedId === this.id) {
      for (const chartId in this.$global.charts) {
        // Skip calling setVisibleRange on chart if self
        if (chartId === this.id) continue;
        const chart = this.$global.charts[chartId];
        if (!chart.settings.syncRange) continue;

        // Update charts pixels per element
        const dimensions = this.$global.layout.chartDimensions;
        if (!dimensions[chart.id]) continue;
        const { width: w1 } = dimensions[chart.id].main;
        const { width: w2 } = dimensions[this.id].main;
        const diff = w1 / w2;

        // Calculate pixels per element relative to chart layout. This is because
        // different charts can have different viewpoints
        chart.setPixelsPerElement(this.pixelsPerElement * diff);
        chart.setVisibleRange({ start, end }, movedId);
      }
    }

    this.computedState.generateAllInstructions();
  }

  onGenerateAllInstructions({
    instructions,
    visibleRange,
    pixelsPerElement,
    maxDecimalPlaces,
  }) {
    this.setPixelsPerElement(pixelsPerElement);
    this.maxDecimalPlaces = maxDecimalPlaces;
    this.instructions = instructions;

    if (this.settings.lockedYScale) {
      this.range.max = visibleRange.max;
      this.range.min = visibleRange.min;
    }

    this.renderedRange = visibleRange;

    this.$global.crosshair.updateCrosshairTimeAndPrice(this);

    this.$global.settings.onChartChangeRangeOrTimeframe(this.id, {
      range: this.range,
    });

    // Check for any un-fetched data points in all subscribed datasets
    for (const datasetId in this.datasets) {
      this.$global.data.requestDataPoints({
        dataset: this.datasets[datasetId],
        start: this.range.start,
        end: this.range.end,
      });
    }
  }

  /**
   * Set the initial visible range of data
   */
  setInitialVisibleRange() {
    const { width } = this.$global.layout.chartDimensions[this.id].main;
    let { start, end } = this.range;

    // End timestamp based on last element
    let endTimestamp;
    if (!this.datasets.length) {
      endTimestamp = Math.floor(Date.now() / this.timeframe) * this.timeframe;
    } else {
      const id = `${this.datasets[0]}:${this.timeframe}`;
      const { data } = this.$global.data.datasets[id];
      endTimestamp = data[data.length - 1].time;
    }

    end = endTimestamp + this.timeframe * 5;

    // Calculate start timestamp using width and pixelsPerElement
    const candlesInView = width / this.pixelsPerElement;

    // Set start to candlesInView lookback
    start = end - candlesInView * this.timeframe;

    this.setVisibleRange({ start, end });
  }

  resizeXRange(delta, width) {
    const ppe = this.pixelsPerElement;

    if (delta < 0) {
      this.setPixelsPerElement(Math.max(1, ppe - ppe / 5));
    } else if (delta > 0) {
      this.setPixelsPerElement(Math.min(ppe + ppe / 5, 1000));
    }

    // End timestamp based on last element
    const { end } = this.range;

    // Calculate start timestamp using width and pixelsPerElement
    const candlesInView = width / this.pixelsPerElement;
    // Set start to candlesInView lookback
    const start = end - candlesInView * this.timeframe;

    this.setVisibleRange({ start, end });
  }

  setDefaultRangeBounds({ start, end, min, max }) {
    if (!this.defaultRangeBounds) {
      this.defaultRangeBounds = {};
    }
    if (start) this.defaultRangeBounds.start = start;
    if (end) this.defaultRangeBounds.end = end;
    if (min) this.defaultRangeBounds.min = min;
    if (max) this.defaultRangeBounds.max = max;
  }

  setPixelsPerElement(pixelsPerElement) {
    this.pixelsPerElement = pixelsPerElement;
    this.$global.settings.onChartChangeRangeOrTimeframe(this.id, {
      pixelsPerElement,
    });
  }

  getTimestampByXCoord(x) {
    return Utils.getTimestampByXCoord(
      this.renderedRange.start,
      this.renderedRange.end,
      this.$global.layout.chartDimensions[this.id].main.width,
      x
    );
  }

  getXCoordByTimestamp(timestamp) {
    return Utils.getXCoordByTimestamp(
      this.renderedRange.start,
      this.renderedRange.end,
      this.$global.layout.chartDimensions[this.id].main.width,
      timestamp
    );
  }

  getYCoordByPrice(price) {
    return Utils.getYCoordByPrice(
      this.renderedRange.min,
      this.renderedRange.max,
      this.$global.layout.chartDimensions[this.id].main.height,
      price
    );
  }

  /**
   * When React UI component re-mounts, update canvas element for children
   */
  onNewCanvas() {
    const { main, xScale, yScale } = this.$global.ui.charts[this.id].subcharts;

    this.$global.layout.resize();
    this.subcharts.main.setCanvasElement(main.current);
    this.subcharts.xScale.canvas.setCanvasElement(xScale.current);
    this.subcharts.yScale.canvas.setCanvasElement(yScale.current);
  }

  setScaleType(type) {
    this.updateSettings({
      scaleType: type,
      lockedYScale: true,
    });
    this.setInitialVisibleRange();
  }

  updateSettings(updates) {
    Object.assign(this.settings, updates);
    this.fireEvent("update-settings", this.settings);
    this.$global.settings.onChartChangeSettings(this.id, this.settings);
  }
}
