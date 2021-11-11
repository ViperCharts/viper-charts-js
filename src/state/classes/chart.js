import Constants from "../../constants.js";

import Utils from "../../utils.js";

import Main from "../../components/canvas_components/main.js";
import TimeScale from "../../components/canvas_components/time_scale.js";
import PriceScale from "../../components/canvas_components/price_scale.js";

import StorageManager from "../../managers/storage.js";
import ComputedData from "./computed_data.js";

import EventEmitter from "../../events/event_emitter.ts";

export default class ChartState extends EventEmitter {
  constructor({ $global, timeframe = Constants.HOUR }) {
    super();

    this.$global = $global;
    this.isInitialized = false;

    this.id = Utils.uniqueId();
    this.timeframe = 0;
    this.pixelsPerElement = 10;
    this.indicators = {};
    this.range = [];
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
      scaleType: "normalized",
    };

    this.setTimeframe(timeframe);
  }

  init() {
    if (this.isInitialized) return;

    this.$global.layout.addEventListener(`resize-${this.id}`, ({ main }) => {
      this.resizeXRange(0, main.width);
    });

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
  }

  addIndicator(indicator, { source, name }) {
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

    // Create an instance of the indicator class
    const indicatorClass = new indicator.class({
      $state,
      canvas,
      datasetId: localId,
    });

    indicator = {
      id: indicator.id,
      name: indicator.name,
      visible: true,
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
      start: this.range[0],
      end: this.range[1],
    });

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
    this.visibleData = {};
    this.datasets = {};
    this.timeframe = timeframe;
    this.fireEvent("set-timeframe", timeframe);
    if (this.isInitialized) {
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
        start: this.range[0],
        end: this.range[1],
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

    this.setVisibleRange();
  }

  setVisibleRange(newRange = {}, movedId = this.id) {
    const { start = this.range[0], end = this.range[1] } = newRange;
    const visibleData = {};

    const { range } = this;

    const datasets = Object.values(this.datasets);
    if (datasets.length > 0) {
      // Loop through each dataset and find the max value
      for (const dataset of datasets) {
        const { data } = dataset;
        const localId = dataset.getTimeframeAgnosticId();

        this.$global.data.requestDataPoints({
          dataset,
          start: this.range[0],
          end: this.range[1],
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

    range[0] = start;
    range[1] = end;

    // Re-calculate all set visible data
    this.computedData.calculateAllSets();

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
        const { width: w1 } = dimensions[chart.id].main;
        const { width: w2 } = dimensions[this.id].main;
        const diff = w1 / w2;

        // Calculate pixels per element relative to chart layout. This is because
        // different charts can have different viewpoints
        chart.pixelsPerElement = this.pixelsPerElement * diff;
        chart.setVisibleRange({ start, end }, movedId);
      }
    }

    this.buildXAndYVisibleScales();
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

  /**
   * Set the initial visible range of data
   */
  setInitialVisibleRange() {
    const { width } = this.$global.layout.chartDimensions[this.id].main;

    // End timestamp based on last element
    let endTimestamp;
    if (!this.datasets.length) {
      endTimestamp = Math.floor(Date.now() / this.timeframe) * this.timeframe;
    } else {
      const id = `${this.datasets[0]}:${this.timeframe}`;
      const { data } = this.$global.data.datasets[id];
      endTimestamp = data[data.length - 1].time;
    }

    const end = endTimestamp + this.timeframe * 5;

    // Calculate start timestamp using width and pixelsPerElement
    const candlesInView = width / this.pixelsPerElement;
    // Set start to candlesInView lookback
    const start = end - candlesInView * this.timeframe;

    this.setVisibleRange({ start, end });
  }

  resizeXRange(delta, width) {
    const ppe = this.pixelsPerElement;

    if (delta < 0) {
      this.pixelsPerElement = Math.max(1, ppe - ppe / 5);
    } else if (delta > 0) {
      this.pixelsPerElement = Math.min(ppe + ppe / 5, 1000);
    }

    // End timestamp based on last element
    const end = this.range[1];

    // Calculate start timestamp using width and pixelsPerElement
    const candlesInView = width / this.pixelsPerElement;
    // Set start to candlesInView lookback
    const start = end - candlesInView * this.timeframe;

    this.setVisibleRange({ start, end });
  }

  setRange(
    {
      start = this.range[0],
      end = this.range[1],
      min = this.range[2],
      max = this.range[3],
    },
    noRecalc
  ) {
    if (!noRecalc) this.computedData.calculateAllSets();

    this.range[0] = start;
    this.range[1] = end;

    // If price / y scale is locked, set min and max y values
    if (this.settings.lockedYScale) {
      const ySpread5P = (max - min) * 0.05;
      if (min !== this.range[2]) {
        this.range[2] = min - ySpread5P;
      }
      if (max !== this.range[3]) {
        this.range[3] = max + ySpread5P;
      }
    }
  }

  getTimestampByXCoord(x) {
    const [start, end] = this.range;
    const msInView = end - start;
    const perc = x / this.$global.layout.chartDimensions[this.id].main.width;
    const time = perc * msInView;
    return start + time;
  }

  getXCoordByTimestamp(timestamp) {
    const [start, end] = this.range;
    const msInView = end - start;
    const msFromStart = timestamp - start;
    const perc = msFromStart / msInView;
    const w = this.$global.layout.chartDimensions[this.id].main.width;
    return Math.floor(perc * w);
  }

  getYCoordByPrice(price) {
    const [, , min, max] = this.range;
    const yInView = max - min;
    const yFromMin = price - min;
    const perc = yFromMin / yInView;
    const h = this.$global.layout.chartDimensions[this.id].main.height;
    const y = -Math.floor(perc * h - h);
    return Math.min(Math.max(y, -1), h);
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

  updateSettings(updates) {
    Object.assign(this.settings, updates);
    this.fireEvent("update-settings", updates);
  }
}
