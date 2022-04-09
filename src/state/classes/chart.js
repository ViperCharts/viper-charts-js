import Constants from "../../constants.js";

import Utils from "../../utils.js";

import PlotTypes from "../../components/plot_types.js";

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
    ranges = {
      x: { start: 0, end: 0 },
      y: {},
    },
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
    this.selectedDatasetGroup = "";
    this.maxDecimalPlaces = 0;
    this.instructions = Instructions;
    this.computedState = this.$global.workers.createComputedState(this);
    this.subcharts = {
      main: undefined,
      xScale: undefined,
      yScale: undefined,
    };
    this.ranges = JSON.parse(JSON.stringify(ranges));
    this.renderedRanges = JSON.parse(JSON.stringify(ranges));
    this.settings = {
      syncRange: false,
      syncWithCrosshair: "",
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

    this.onResizeListener = (() => this.resizeXRange(0)).bind(this);
    this.$global.layout.addEventListener(
      `resize-${this.id}`,
      this.onResizeListener
    );

    const $state = {
      chart: this,
      global: this.$global,
      dimensions: this.$global.layout.chartDimensions[this.id],
    };

    // Add first layer if none
    if (!Object.keys(this.ranges.y).length) {
      this.addLayer(10);
    }

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
    datasets = datasets.map((dataset) => {
      const { source, name } = this.$global.data.addOrGetDataset({
        source: dataset.source,
        name: dataset.name,
        timeframe: this.timeframe,
      });
      return { source, name };
    });

    this.datasetGroups[id] = {
      id,
      visible,
      datasets,
      indicators: {},
      synced,
    };

    if (!this.selectedDatasetGroup.length) {
      this.setSelectedDatasetGroup(id);
    }

    // Update chart UI
    this.$global.ui.charts[this.id].updateDatasetGroups(this.datasetGroups);

    return this.datasetGroups[id];
  }

  updateDatasetGroup(datasetGroupId, newDatasets) {
    const group = this.datasetGroups[datasetGroupId];

    const oldId = `${group.datasets[0].source}:${group.datasets[0].name}`;
    const oldDataset = this.datasets[oldId];

    const newDataset = this.$global.data.addOrGetDataset({
      source: newDatasets[0].source,
      name: newDatasets[0].name,
      timeframe: this.timeframe,
    });
    const newId = newDataset.getTimeframeAgnosticId();

    let subscribers = [];
    const indicatorUpdates = {};

    // Update array on dataset group
    for (const id in group.indicators) {
      subscribers = oldDataset.removeSubscriber(this.id, id);
      const indicator = group.indicators[id];
      indicator.datasetId = newId;
      indicatorUpdates[id] = { datasetId: newId };
      newDataset.addSubscriber(this.id, id, [indicator.model.id]);
      this.computedState.emptySet({ renderingQueueId: id });
    }

    // If no more indicators on chart consuming this dataset, delete from memory
    if (!Object.keys(subscribers).length) {
      delete this.datasets[oldId];
    }

    this.datasets[newId] = newDataset;
    group.datasets = newDatasets.map((d) => ({
      source: d.source,
      name: d.name,
    }));

    this.computedState.updateIndicators(indicatorUpdates);

    // Update chart UI
    this.$global.ui.charts[this.id].updateDatasetGroups(this.datasetGroups);
    this.$global.settings.onChartDatasetGroupsChange(
      this.id,
      this.datasetGroups
    );
  }

  /**
   * Add an indicator to this chart by id or by object
   * @param {string|indicator} indicator The indicator to add
   * @param {*} options
   */
  async addIndicator(
    indicator,
    datasetGroupId,
    model,
    { visible = true, layerId = Object.keys(this.ranges.y)[0] }
  ) {
    // If indicator passed was a string, assume its indicator id
    if (typeof indicator === "string") {
      indicator = PlotTypes.getIndicatorById(indicator);
    }

    if (!layerId || !this.ranges.y[layerId]) {
      layerId = this.addLayer(3);
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
      model,
      color,
      layerId,
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
    this.ranges.y[layerId].indicators[renderingQueueId] = { visible };

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
    dataset.addSubscriber(this.id, renderingQueueId, [model.id]);
    this.datasets[localId] = dataset;

    group.indicators[renderingQueueId] = indicator;
    this.datasetGroups[group.id] = group;

    // Update chart UI
    this.$global.ui.charts[this.id].updateDatasetGroups(this.datasetGroups);

    // Request data points for dataset
    this.$global.data.requestDataPoints({
      dataset,
      start: this.ranges.x.start,
      end: this.ranges.x.end,
    });

    this.$global.settings.onChartDatasetGroupsChange(
      this.id,
      this.datasetGroups
    );
  }

  addLayer(heightUnit) {
    const id = Utils.uniqueId();

    this.ranges.y[id] = {
      heightUnit,
      lockedYScale: true,
      visible: true,
      fullscreen: false,
      scaleType: "default",
      indicators: {},
      range: { min: Infinity, max: -Infinity },
    };
    this.renderedRanges.y[id] = { range: { min: Infinity, max: -Infinity } };

    this.$global.layout.chartDimensions[this.id].updateLayers();
    this.$global.settings.onChartChangeRangeOrTimeframe(this.id, {
      ranges: JSON.parse(JSON.stringify(this.ranges)),
    });

    return id;
  }

  /**
   * Toggle layer fullscreen
   * @param {string} layerId
   */
  toggleLayerFullScreen(layerId) {
    const layer = this.ranges.y[layerId];
    layer.fullscreen = !layer.fullscreen;

    // Disable fullscreen on all other charts if fullscreen is true
    if (layer.fullscreen) {
      for (const id in this.ranges.y) {
        if (id !== layerId) this.ranges.y[id].fullscreen = false;
      }
    }

    this.$global.layout.chartDimensions[this.id].updateLayers();
    this.setVisibleRange({});
  }

  setLayerScaleType(layerId, scaleType) {
    this.ranges.y[layerId].scaleType = scaleType;
    this.ranges.y[layerId].lockedYScale = true;
    this.setVisibleRange({});
  }

  removeLayer(layerId) {
    const keys = Object.keys(this.ranges.y);
    // If this is the last layer, don't delete it
    if (keys.length === 1) return;

    // If any indicators on layer, delete them
    for (const id in this.ranges.y[layerId].indicators) {
      const group = Object.values(this.datasetGroups).find(
        ({ indicators }) => !!indicators[id]
      );
      this.removeIndicator(group.id, id);
    }

    delete this.ranges.y[layerId];
    keys.splice(keys.indexOf(layerId), 1);
    if (keys.length === 1) this.ranges.y[keys[0]].heightUnit = 10;
    this.$global.layout.chartDimensions[this.id].updateLayers();

    this.$global.settings.onChartChangeRangeOrTimeframe(this.id, {
      ranges: JSON.parse(JSON.stringify(this.ranges)),
    });
  }

  setTimeframe(timeframe, movedId = this.id) {
    if (timeframe === this.timeframe) return;

    const oldDatasets = {};

    // Copy all datasets so we can reset master in preperation for setting new visible range
    for (const oldDataset of Object.values(this.datasets)) {
      oldDatasets[oldDataset.getTimeframeAgnosticId()] = oldDataset;
    }

    // Now that we have unsubscribed from datasets, and emptied the local dataset array
    // We can reset to initial default range
    this.datasets = {};
    this.timeframe = timeframe;

    // Clear all computed indicator results
    this.computedState.emptyAllSets();

    if (this.isInitialized) {
      // Update range.start to be same pixelsPerElement calculation
      const { width } = this.$global.layout.chartDimensions[this.id].main;
      const { ranges, pixelsPerElement } = this;
      ranges.x.start = ranges.x.end - timeframe * (width / pixelsPerElement);

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
      const subscribers = { ...oldDataset.subscribers[this.id] };
      for (const id in subscribers) {
        dataset.addSubscriber(this.id, id, subscribers[id]);
        oldDataset.removeSubscriber(this.id, id);
      }

      this.datasets[dataset.getTimeframeAgnosticId()] = dataset;

      this.$global.data.requestDataPoints({
        dataset,
        start: this.ranges.x.start,
        end: this.ranges.x.end,
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

    this.fireEvent("set-timeframe", timeframe);
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

    // Update indicator visibility for layer
    const layer = this.ranges.y[indicator.layerId];
    layer.indicators[renderingQueueId].visible = indicator.visible;
    const layerIndicatorIds = Object.keys(layer.indicators);
    for (let i = 0; i < layerIndicatorIds.length; i++) {
      if (layer.indicators[layerIndicatorIds[i]].visible) {
        layer.visible = true;
        break;
      }

      // If reached last item without finding visible indicator
      if (i === layerIndicatorIds.length - 1) {
        layer.visible = false;
      }
    }

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

    // If selected dataset group
    if (this.selectedDatasetGroup === datasetGroupId) {
      const group = Object.keys(this.datasetGroups)[0] || "";
      this.setSelectedDatasetGroup(group);
    }

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

    // Remove indicator from layer and delete layer if no indicators
    delete this.ranges.y[indicator.layerId].indicators[renderingQueueId];
    if (!Object.keys(this.ranges.y[indicator.layerId].indicators).length) {
      this.removeLayer(indicator.layerId);
    }

    // Remove dataset listener and dataset if no more listeners;
    const dataset = this.datasets[indicator.datasetId];
    const subscribers = dataset.removeSubscriber(this.id, renderingQueueId);
    if (!Object.keys(subscribers).length) {
      delete this.datasets[dataset.getTimeframeAgnosticId()];
    }

    this.computedState.removeFromQueue({ renderingQueueId });
    delete group.indicators[renderingQueueId];

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
   * @param {number} layerId Layer moving
   * @param {string} movedId The chart id of the chart that initialzed the move
   */
  async setVisibleRange(
    newRange = {},
    layerId = Object.keys(this.ranges.y)[0],
    movedId = this.id
  ) {
    const {
      start = this.ranges.x.start,
      end = this.ranges.x.end,
      min = this.ranges.y[layerId].range.min,
      max = this.ranges.y[layerId].range.max,
    } = newRange;

    this.ranges.x = { start, end };
    this.ranges.y[layerId].range = { min, max };

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
        chart.setVisibleRange({ start, end }, undefined, movedId);
      }
    }

    this.computedState.generateAllInstructions();
  }

  onGenerateAllInstructions({
    instructions,
    visibleRanges,
    pixelsPerElement,
    maxDecimalPlaces,
  }) {
    this.setPixelsPerElement(pixelsPerElement);
    this.maxDecimalPlaces = maxDecimalPlaces;
    this.instructions = instructions;

    this.renderedRanges.x = visibleRanges.x;

    for (const layerId in visibleRanges.y) {
      this.ranges.y[layerId].range.min = visibleRanges.y[layerId].min;
      this.ranges.y[layerId].range.max = visibleRanges.y[layerId].max;
      this.renderedRanges.y[layerId].range.min = visibleRanges.y[layerId].min;
      this.renderedRanges.y[layerId].range.max = visibleRanges.y[layerId].max;
    }

    this.$global.crosshair.updateCrosshairTimeAndPrice(this);

    this.$global.settings.onChartChangeRangeOrTimeframe(this.id, {
      ranges: JSON.parse(JSON.stringify(this.ranges)),
    });

    // Check for any un-fetched data points in all subscribed datasets
    for (const datasetId in this.datasets) {
      this.$global.data.requestDataPoints({
        dataset: this.datasets[datasetId],
        start: this.ranges.x.start,
        end: this.ranges.x.end,
      });
    }
  }

  /**
   * Set the initial visible range of data
   */
  setInitialVisibleRange() {
    const { width } = this.$global.layout.chartDimensions[this.id].main;
    let { start, end } = this.ranges.x;

    // End timestamp based on last element
    let endTimestamp;

    if (this.datasets.length) {
      const id = `${this.datasets[0]}:${this.timeframe}`;
      const { data } = this.$global.data.datasets[id];
      endTimestamp = data[data.length - 1].time;
    }

    // Safety fallback
    if (
      endTimestamp === undefined ||
      start === undefined ||
      end === undefined
    ) {
      endTimestamp = Math.floor(Date.now() / this.timeframe) * this.timeframe;
    }

    this.pixelsPerElement = 10;

    end = endTimestamp + this.timeframe * 10;

    // Calculate start timestamp using width and pixelsPerElement
    const candlesInView = width / this.pixelsPerElement;

    // Set start to candlesInView lookback
    start = end - candlesInView * this.timeframe;

    this.setVisibleRange({ start, end });
  }

  resizeXRange(change, left = 0.5, right = 0.5) {
    const { width } = this.$global.layout.chartDimensions[this.id].main;

    let { start, end } = this.ranges.x;
    let range = end - start;

    if (change < 0) {
      start -= (range * left) / 10;
      end += (range * right) / 10;
    } else if (change > 0) {
      start += (range * left) / 10;
      end -= (range * right) / 10;
    }

    // Calcualte new pixels per element based on new range
    const ppe = width / ((end - start) / this.timeframe);

    // If pixels per element is less than 1 or greater than 1000, dont apply changes
    if (ppe < 1 || ppe > 1000) return;

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

  setSelectedDatasetGroup(datasetGroup) {
    this.selectedDatasetGroup = datasetGroup;
    this.fireEvent("set-selected-dataset-group", datasetGroup);
  }

  setPixelsPerElement(pixelsPerElement) {
    this.pixelsPerElement = pixelsPerElement;
    this.$global.settings.onChartChangeRangeOrTimeframe(this.id, {
      pixelsPerElement,
    });
  }

  getTimestampByXCoord(x) {
    return Utils.getTimestampByXCoord(
      this.renderedRanges.x.start,
      this.renderedRanges.x.end,
      this.$global.layout.chartDimensions[this.id].main.width,
      x
    );
  }

  getXCoordByTimestamp(timestamp) {
    return Utils.getXCoordByTimestamp(
      this.renderedRanges.x.start,
      this.renderedRanges.x.end,
      this.$global.layout.chartDimensions[this.id].main.width,
      timestamp
    );
  }

  getYCoordByPrice(price, layerId = Object.keys(this.ranges.y)[0]) {
    const { main } = this.$global.layout.chartDimensions[this.id];
    const { top, height } = main.layers[layerId];
    const { range } = this.renderedRanges.y[layerId];
    return top + Utils.getYCoordByPrice(range.min, range.max, height, price);
  }

  getPriceByYCoord(yCoord, layerId = Object.keys(this.ranges.y)[0]) {
    const { main } = this.$global.layout.chartDimensions[this.id];
    const { top, height } = main.layers[layerId];
    const { range } = this.renderedRanges.y[layerId];
    return Utils.getPriceByYCoord(range.min, range.max, height, yCoord - top);
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

  getLayerByYCoord(yCoord) {
    const { layers } = this.$global.layout.chartDimensions[this.id].main;
    const ids = Object.keys(layers).filter((id) => layers[id].height > 0);

    for (let i = 0; i < ids.length; i++) {
      const l1 = layers[ids[i]];
      const l2 = layers[ids[i + 1]];

      // If no next layer, current layer
      if (!l2) return ids[i];

      // If between top and bottom of layer in question
      if (yCoord >= l1.top && yCoord <= l2.top) return ids[i];
    }
  }

  updateSettings(updates) {
    // If enabling sync range, update all other synced charts to same timeframe and range as this chart
    if (updates.syncRange) {
      for (const chartId in this.$global.charts) {
        const chart = this.$global.charts[chartId];
        if (!chart.settings.syncRange) continue;

        if (chart.timeframe !== this.timeframe) {
          chart.setTimeframe(this.timeframe);
        }
        chart.setVisibleRange(this.ranges.x);
      }
    }
    Object.assign(this.settings, updates);
    this.fireEvent("update-settings", this.settings);
    this.$global.settings.onChartChangeSettings(this.id, this.settings);
  }
}
