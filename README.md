# ViperCharts

ViperCharts is a free and open-source cross-market charting platform for plotting financial data including lines, candlesticks, moving averages, and more. It provides a flexible and extensible framework for creating interactive charts with support for multiple data sources, timeframes, and visualization types.

**NOTE: This is still an early Beta build of the package. The API is subject to changes in the future. Please use for experimental purposes.**

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Basic Usage](#basic-usage)
- [Configuration](#configuration)
- [Data Models](#data-models)
- [Features](#features)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Building for Production](#building-for-production)
- [Demo](#demo)

## Installation

Install the package using npm:

```bash
npm install @viper-charts/viper-charts
```

## Quick Start

### Running the Demo

To run the demo application locally:

```bash
npm install
npm run start
```

This will start a development server where you can see ViperCharts in action.

### Basic Integration

To use ViperCharts in your application:

```javascript
import ViperCharts from "@viper-charts/viper-charts";

const Viper = new ViperCharts({
  element: document.getElementById("viper-container"),
});
```

## Basic Usage

### Creating a Viper Instance

The ViperCharts constructor accepts a configuration object with the following properties:

```javascript
const Viper = new ViperCharts({
  element: HTMLElement,              // Required: Container element for Viper
  sources: SourcesObject,             // Optional: Dataset sources map
  settings: Object,                   // Optional: Settings object
  onRequestHistoricalData: Function,  // Optional: Handler for historical data requests
  onRequestOrders: Function,          // Optional: Handler for order data requests
  onSaveViperSettings: Function,     // Optional: Handler for saving settings
  onRequestTemplates: Function,       // Optional: Handler for loading templates
  onSaveTemplate: Function,           // Optional: Handler for saving templates
  onDeleteTemplate: Function,        // Optional: Handler for deleting templates
  workerScriptURL: String,            // Optional: URL for worker script
});
```

### Adding Data Sources

Data sources define the available datasets and their properties. Here's an example configuration:

```javascript
const sources = {
  BINANCE: {
    BTCUSDT: {
      source: "BINANCE",
      name: "BTCUSDT",
      maxItemsPerRequest: 500,
      models: {
        price: {
          id: "price",
          model: "ohlc",
          name: "Price",
          label: "Binance:BTCUSDT"
        }
      },
      timeframes: [
        60000,        // 1 minute
        60000 * 5,    // 5 minutes
        60000 * 15,   // 15 minutes
        60000 * 60,   // 1 hour
        60000 * 60 * 4,  // 4 hours
        60000 * 60 * 24, // 1 day
      ],
    },
  },
};
```

### Handling Historical Data Requests

ViperCharts will request historical data through the `onRequestHistoricalData` callback:

```javascript
async function onRequestHistoricalData({ requests }) {
  for (const { source, name, timeframe, dataModels, start, end } of requests) {
    if (source === "BINANCE") {
      for (const dataModel of dataModels) {
        // Fetch data from your API
        const data = await fetchHistoricalData(source, name, timeframe, start, end);
        
        // Add data to Viper
        Viper.addData({ source, name, timeframe, dataModel }, data);
      }
    }
  }
}
```

### Adding Data

Data should be provided as an object where keys are ISO timestamp strings and values are the data points:

```javascript
const data = {
  "2024-01-01T00:00:00.000Z": {
    open: 42000,
    high: 42500,
    low: 41800,
    close: 42200,
  },
  "2024-01-01T01:00:00.000Z": {
    open: 42200,
    high: 42800,
    low: 42100,
    close: 42700,
  },
  // ... more data points
};

Viper.addData({ source: "BINANCE", name: "BTCUSDT", timeframe: 3600000, dataModel: "price" }, data);
```

## Configuration

### Sources Object Structure

```typescript
type SourcesObject = {
  [sourceKey: string]: {
    [datasetName: string]: DatasetSource;
  };
};

type DatasetSource = {
  source: string;                    // Dataset source identifier (e.g., "BINANCE", "COINBASE")
  name: string;                      // Dataset name (e.g., "BTCUSDT", "BTC-USD")
  models: { [key: string]: DataModel }; // Supported data models
  maxItemsPerRequest: number;         // Max candles per request (for rate limiting)
  timeframes: number[];              // Supported timeframes in milliseconds
};

type DataModel = {
  id: string;                        // Unique identifier for the data model
  name: string;                      // Display name
  model: string;                     // Model type (see Data Models section)
  label: string;                     // Label for Y-axis
};
```

## Data Models

ViperCharts supports several data model types:

- **value**: Single numeric value
- **ohlc**: Open, High, Low, Close price data
- **volume**: Volume data
- **volumeBySide**: Buy and sell volume separated
- **orderbookHeatmap**: Historical orderbook heatmap data
- **footprint**: Executed volume by side at different price levels

### Example Data Formats

**OHLC Model:**
```javascript
{
  "2024-01-01T00:00:00.000Z": {
    open: 42000,
    high: 42500,
    low: 41800,
    close: 42200
  }
}
```

**Volume by Side Model:**
```javascript
{
  "2024-01-01T00:00:00.000Z": {
    buyVolume: 150.5,
    sellVolume: 120.3
  }
}
```

**Footprint Model:**
```javascript
{
  "2024-01-01T00:00:00.000Z": {
    spread: 0.01,
    prices: {
      "42000": { buy: 10, sell: 5 },
      "42001": { buy: 8, sell: 12 },
      // ... more price levels
    }
  }
}
```

## Features

### Chart Types

ViperCharts supports multiple chart types:

- **Line Charts**: Plot single value data as lines
- **Candlestick Charts**: Display OHLC data as candlesticks
- **Volume Charts**: Show volume data as bars
- **Volume by Side**: Display buy/sell volume separately
- **Footprint Charts**: Show order flow and executed volume at price levels
- **Orderbook Heatmap**: Visualize historical orderbook data

### Indicators

Built-in indicators include:

- **SMA (Simple Moving Average)**: Moving average calculations
- **MA Slope**: Slope of moving average
- **Bollinger Bands**: Upper, middle, and lower bands
- **Bollinger Bands Width**: Width of Bollinger Bands
- **Cumulative Volume Delta (CVD)**: Cumulative buy/sell volume difference
- **Delta Bars**: Volume delta visualization
- **Delta Footprint**: Footprint with delta highlighting
- **Volume Per Tick**: Volume analysis per price tick
- **Volume Profile Session**: Session-based volume profile
- **OHLC Change**: Visualization of price changes

### Multiple Charts

You can create and manage multiple charts simultaneously. Each chart can have:
- Independent timeframes
- Multiple dataset groups
- Custom indicators
- Independent zoom and pan

### Chart Management

- Add/remove charts dynamically
- Save and load chart templates
- Sync charts with crosshair
- Customizable chart settings

### Orders

Display order data on charts:

```javascript
Viper.addOrUpdateOrder(datasetId, {
  orderId: "12345",
  side: "buy",  // or "sell"
  price: 42000,
  quantity: 1.5
});
```

## API Reference

### Instance Methods

#### `getSelectedChart()`
Returns the currently selected chart instance.

```javascript
const chart = Viper.getSelectedChart();
```

#### `getChartByName(name)`
Get a chart by its name.

```javascript
const chart = Viper.getChartByName("My Chart");
```

#### `addDataset({ source, name, timeframe, data })`
Add a new dataset to the chart.

```javascript
Viper.addDataset({
  source: "BINANCE",
  name: "BTCUSDT",
  timeframe: 3600000,
  data: { /* data object */ }
});
```

#### `setAllDataSources(sources)`
Set all available data sources.

```javascript
Viper.setAllDataSources({
  BINANCE: { /* ... */ },
  COINBASE: { /* ... */ }
});
```

#### `addData({ source, name, timeframe, dataModel }, updates, options)`
Add or update data for a dataset.

```javascript
Viper.addData(
  { source: "BINANCE", name: "BTCUSDT", timeframe: 3600000, dataModel: "price" },
  { /* data updates */ },
  { noResolve: false, updateVisibleRange: false }
);
```

#### `addOrUpdateOrder(timeframeAgnosticDatasetId, order)`
Add, update, or remove an order for a dataset.

```javascript
Viper.addOrUpdateOrder("BINANCE:BTCUSDT", {
  orderId: "12345",
  side: "buy",
  price: 42000,
  quantity: 1.5
});
```

#### `destroy()`
Destroy the Viper instance and clean up resources.

```javascript
Viper.destroy();
```

## Examples

### Complete Example

```javascript
import ViperCharts from "@viper-charts/viper-charts";

// Define data sources
const sources = {
  BINANCE: {
    BTCUSDT: {
      source: "BINANCE",
      name: "BTCUSDT",
      maxItemsPerRequest: 500,
      models: {
        price: {
          id: "price",
          model: "ohlc",
          name: "Price",
          label: "Binance:BTCUSDT"
        }
      }
    }
  }
};

// Create Viper instance
const Viper = new ViperCharts({
  element: document.getElementById("chart"),
  sources,
  settings: JSON.parse(localStorage.getItem("settings")) || {},
  onRequestHistoricalData: async ({ requests }) => {
    for (const { source, name, timeframe, dataModels, start, end } of requests) {
      if (source === "BINANCE") {
        // Fetch data from API
        const response = await fetch(
          `https://api.binance.com/api/v3/klines?symbol=${name}&interval=1h&startTime=${start}&endTime=${end}`
        );
        const klines = await response.json();
        
        // Format data
        const data = {};
        for (const kline of klines) {
          const [timestamp, open, high, low, close] = kline;
          data[new Date(timestamp).toISOString()] = {
            open: +open,
            high: +high,
            low: +low,
            close: +close
          };
        }
        
        // Add data to Viper
        for (const dataModel of dataModels) {
          Viper.addData({ source, name, timeframe, dataModel }, data);
        }
      }
    }
  },
  onSaveViperSettings: (settings) => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }
});
```

For more examples, see the `/src/index.js` file in the repository.

## Building for Production

### Development Build

```bash
npm run start
```

### Production Build

For Unix/Linux/macOS:
```bash
npm run build-unix
```

For Windows:
```bash
npm run build-windows
```

### Static Build

```bash
npm run build-static
```

The built files will be in the `dist/` directory.

## Demo

A public demo is available at [https://viper-charts.netlify.app/](https://viper-charts.netlify.app/)

## License

This project is licensed under CC0 (Creative Commons Zero).

## Support

- **Issues**: [GitHub Issues](https://github.com/ViperCharts/viper-charts-js/issues)
- **Email**: vipercharts@protonmail.com
