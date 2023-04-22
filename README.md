# ViperCharts 🐍

Viper Charts is an open-source charting library for plotting lines, candlesticks, moving averages, and more.

**NOTE: This is still an early Beta build of the package. The API is subject to changes in the future. Please use for experimental purposes.**

# Run Demo

```
npm i
npm run start
```

## Usage

To make a new Viper instance, import viper-charts and then create a new class instance

```js
import ViperCharts from "@vipercharts/viper-charts";

const Viper = new ViperCharts({
  element: document.getElementById("viper-container"),
});
```

The returned Viper instance includes the entire Viper instance. Everything from managing the layout of existing charts, adding / removing charts, and adding / removing datasets.

The constructor for ViperCharts accepts an object with multiple properties. Here's a list of some

```typescript
type ViperParams = {
  element: HTMLElement; // The container element for Viper
  sources?: SourcesObject; // Dataset sources map / object
  settings?: { [key: string]: any }; // Settings
  onRequestHistoricalData?: Function; // Resolve requests for historical data
  addOrUpdateOrder?: Function; // Resolve requests for Orders belonging to a specific dataset (market)
  onSaveViperSettings?: Function; // Called when viper settings (layout, charts, indicators) udpates (same layout as settings object)
};

type SourcesObject = {
  [key: string]: [key: string]DatasetSource;
};

type DatasetSource = {
  source: string; // Dataset source (ex: COINBASE, FTX)
  name: string; // Dataset name (ex: BTC-USD, BTC-PERP)
  models: [key: string]: DataModel // All supported data models
  maxItemsPerRequest: number; // Max candles to fetch per request (rate limiting, not currently implemented)
  timeframes: [number]; // Array of timeframes in milliseconds supported by dataset (not currently implemented)
};

type DataModel = {
  id: string // Unique id for data model
  name: string // Visible name for data model
  model: string // Model type (ex: ohlc, volumeBySide, footprint) All model types located in the data_models.js file
  label: string // Label used for plotting on Y axis
}
``;
```

Here's an example sources map using the Binance Spot API

```javascript
const sources = {
  BINANCE: {
    BTCUSDT: {
      source: "BINANCE",
      name: "BTCUSDT",
      models: {
        price: {
          id: "price",
          model: "ohlc",
          name: "Price",
          label: "Binance:BTCUSDT"
        }
      }
      maxItemsPerRequest: 500,
      timeframes: [
        60000,
        60000 * 5,
        60000 * 15,
        60000 * 60,
        60000 * 60 * 4,
        60000 * 60 * 24,
      ],
    },
  },
};
```

## Examples

For some examples, look at the /src/index.js file.

## Demo

Also, a public demo is available at [https://viper-charts.netlify.app/](https://viper-charts.netlify.app/)
