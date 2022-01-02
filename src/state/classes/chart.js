import Constants from "../../constants.js";

import Utils from "../../utils.js";

import Main from "../../components/canvas_components/main.js";
import TimeScale from "../../components/canvas_components/time_scale.js";
import PriceScale from "../../components/canvas_components/price_scale.js";

import ComputedData from "./computed_data.js";

import EventEmitter from "../../events/event_emitter";

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
    this.indicators = {};
    this.range = range;
    this.defaultRangeBounds = undefined;
    this.datasets = {};
    this.visibleData = {};
    this.computedData = new ComputedData({ $global, $chart: this });
    this.visibleScales = { x: [], y: [] };
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

    this.throttledCalculateVisibleData = _.throttle(
      this.calculateVisibleData.bind(this),
      100
    );

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

    // Delete all indicators
    Object.keys(this.indicators).map(this.removeIndicator.bind(this));

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

  addIndicator(indicator, { source, name, visible = true }) {
    // Get or create dataset if doesn't exist
    const dataset = this.$global.data.addOrGetDataset({
      source,
      name,
      timeframe: this.timeframe,
    });

    const { canvas } = this.subcharts.main;

    const $state = {
      chart: this,
      global: this.$global,
    };

    const localId = dataset.getTimeframeAgnosticId();
    const color = Utils.randomHexColor();

    // Create an instance of the indicator class
    const indicatorClass = new indicator.class({
      $state,
      canvas,
      color,
      datasetId: localId,
    });

    indicator = {
      id: indicator.id,
      name: indicator.name,
      visible,
      datasetId: localId,
    };

    // Subscribe to dataset updates
    dataset.addSubscriber(this.id, indicatorClass.renderingQueueId);
    this.datasets[localId] = dataset;

    this.indicators[indicatorClass.renderingQueueId] = indicator;

    // Add indicator to UI state
    this.$global.ui.charts[this.id].addIndicator(
      indicatorClass.renderingQueueId,
      indicator
    );

    this.$global.data.requestDataPoints({
      dataset,
      start: this.range.start,
      end: this.range.end,
    });

    this.$global.settings.onChartIndicatorsChange(this.id, this.indicators);

    // If first new dataset, reset range according to data
    this.setInitialVisibleRange();
  }

  setTimeframe(timeframe, movedId = this.id) {
    const oldDatasets = {};

    const oldTimeframe = this.timeframe;

    // Copy all datasets so we can reset master in preperation for setting new visible range
    for (const oldDataset of Object.values(this.datasets)) {
      oldDatasets[oldDataset.getTimeframeAgnosticId()] = oldDataset;
    }

    // Now that we have unsubscribed from datasets, and emptied the local dataset array
    // We can reset to initial default range
    this.visibleData = {};
    this.datasets = {};
    this.timeframe = timeframe;
    this.fireEvent("set-timeframe", timeframe);

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
      const subscribers = oldDataset.subscribers[this.id];
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

    // Take all old datasets and re-subscribe based on active timeframe
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

  toggleVisibility(id) {
    this.computedData.toggleVisibility(id);
    const visible = !this.indicators[id].visible;
    this.indicators[id].visible = visible;
    this.$global.ui.charts[this.id].updateIndicator(id, { visible });

    // Re calculate visible range
    this.setVisibleRange();
  }

  removeIndicator(id) {
    const indicator = this.indicators[id];
    this.computedData.removeFromQueue(id);
    delete this.indicators[id];

    // Remove dataset listener and dataset if no more listeners;
    const dataset = this.datasets[indicator.datasetId];
    const subscribers = dataset.removeSubscriber(this.id, id);
    if (!subscribers.length) {
      delete this.datasets[dataset.getTimeframeAgnosticId()];
    }

    this.$global.ui.charts[this.id].removeIndicator(id);

    this.$global.settings.onChartIndicatorsChange(this.id, this.indicators);

    this.setVisibleRange();
  }

  setVisibleRange(newRange = {}, movedId = this.id) {
    // Set visible range
    const { start = this.range[0], end = this.range[1] } = newRange;

    this.setRange({ start, end });

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

    // Build the visible x and y scales
    this.buildXAndYVisibleScales();

    // Call throttled recalc
    this.throttledCalculateVisibleData();
  }

  buildXAndYVisibleScales() {
    const visibleScales = { x: [], y: [] };
    let xTimeStep = 0;
    let yPriceStep = 0;

    const minPixels = 100;

    for (let i = Constants.TIMESCALES.indexOf(this.timeframe); i >= 0; i--) {
      // Check if this timeframe fits between max and min pixel boundaries
      const pixelsPerScale =
        this.pixelsPerElement * (Constants.TIMESCALES[i] / this.timeframe);

      if (pixelsPerScale >= minPixels) {
        xTimeStep = Constants.TIMESCALES[i];
        break;
      }
    }

    const yRange = this.range[3] - this.range[2];
    const exponent = yRange.toExponential().split("e")[1];
    yPriceStep = Math.pow(10, exponent);

    // Build timestamps that are on interval
    const start = this.range[0] - (this.range[0] % xTimeStep);
    for (let i = start; i < this.range[1]; i += xTimeStep) {
      visibleScales.x.push(i);
    }

    // TODO build y axis range
    const min = this.range[2] - (this.range[2] % yPriceStep);
    for (let i = min; i < this.range[3]; i += yPriceStep) {
      visibleScales.y.push(i);
    }

    this.visibleScales = visibleScales;
  }

  calculateVisibleData() {
    const visibleData = {};

    const [start, end] = this.range;

    // Get all visible data in viewport
    const datasets = Object.values(this.datasets);
    if (datasets.length > 0) {
      // Loop through each dataset and find the max value
      for (const dataset of datasets) {
        const { data } = dataset;
        const localId = dataset.getTimeframeAgnosticId();

        this.$global.data.requestDataPoints({
          dataset,
          start: this.range.start,
          end: this.range.end,
        });

        visibleData[localId] = { data: [] };

        // Loop through all subscribed indicators to verify at least one is visible
        let isOneVisible = false;
        for (const renderingQueueId of dataset.subscribers[this.id]) {
          const indicator = this.indicators[renderingQueueId];
          if (indicator.visible) {
            isOneVisible = true;
            break;
          }
        }

        // If no subscribed indicators are visible, skip this dataset from calculation
        if (!isOneVisible) {
          continue;
        }

        const visibleDataItem = visibleData[localId];

        for (const timestamp of Utils.getAllTimestampsIn(
          start,
          end,
          this.timeframe
        )) {
          const candle = data[timestamp];

          // Check if candle has not been loaded or if its loaded, but no data was available at time
          if (candle !== undefined && candle !== null) {
            visibleDataItem.data.push({
              time: timestamp,
              ...candle,
            });
          }
        }
      }

      this.visibleData = visibleData;
    }

    // Re-calculate all set visible data
    this.computedData.calculateAllSets();
  }

  /**
   * Set the initial visible range of data
   */
  setInitialVisibleRange() {
    const { width } = this.$global.layout.chartDimensions[this.id].main;
    let { start, end } = this.range;

    // If no current visible range
    if (!start || !end) {
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
    }

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

  setRange(
    {
      start = this.range.start,
      end = this.range.end,
      min = this.range.min,
      max = this.range.max,
    },
    noRecalc
  ) {
    if (!noRecalc) this.computedData.calculateAllSets();

    this.range.start = start;
    this.range.end = end;

    // If price / y scale is locked, set min and max y values
    if (this.settings.lockedYScale) {
      if (this.defaultRangeBounds) {
        if (this.defaultRangeBounds.min) {
          min = this.defaultRangeBounds.min;
        }
        if (this.defaultRangeBounds.max) {
          max = this.defaultRangeBounds.max;
        }
      }

      const ySpread5P = (max - min) * 0.05;
      if (min !== this.range.min) {
        this.range.min = min - ySpread5P;
      }
      if (max !== this.range.max) {
        this.range.max = max + ySpread5P;
      }
    }

    // Calculate pixels per element using range
    const items = (end - start) / this.timeframe;
    const { width } = this.$global.layout.chartDimensions[this.id].main;
    const ppe = width / items;
    this.pixelsPerElement = ppe;

    this.$global.settings.onChartChangeRangeOrTimeframe(this.id, {
      range: this.range,
    });
  }

  setPixelsPerElement(pixelsPerElement) {
    this.pixelsPerElement = pixelsPerElement;
    this.$global.settings.onChartChangeRangeOrTimeframe(this.id, {
      pixelsPerElement,
    });
  }

  getTimestampByXCoord(x) {
    return Utils.getTimestampByXCoord(
      this.range[0],
      this.range[1],
      this.$global.layout.chartDimensions[this.id].main.width,
      x
    );
  }

  getXCoordByTimestamp(timestamp) {
    return Utils.getXCoordByTimestamp(
      this.range[0],
      this.range[1],
      this.$global.layout.chartDimensions[this.id].main.width,
      timestamp
    );
  }

  getYCoordByPrice(price) {
    return Utils.getYCoordByPrice(
      this.range[2],
      this.range[3],
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
    this.updateSettings({ scaleType: type });
    this.setInitialVisibleRange();
  }

  updateSettings(updates) {
    Object.assign(this.settings, updates);
    this.fireEvent("update-settings", this.settings);
    this.$global.settings.onChartChangeSettings(this.id, this.settings);
  }
}
