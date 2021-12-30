# ViperCharts 🐍

Viper Charts is an open-source charting library for plotting lines, candlesticks, moving averages, and more.

# Run Demo

```
npm i
npm run dev

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
  sources?: DatasetSourceMap; // Dataset sources map / object
  settings?: { [key: string]: any }; // Settings
  onRequestHistoricalData?: Function; // Resolve requests for historical data
  onSaveViperSettings?: Function; // Called when viper settings (layout, charts, indicators) udpates (same layout as settings object)
};

type DatasetSourceMap = {
  [key: string]: DatasetSource;
};

type DatasetSource = {
  source: string; // Dataset source (ex: COINBASE, FTX)
  name: string; // Ticker (ex: BTC-USD, BTC-PERP)
  maxItemsPerRequest: number; // Max candles to fetch per request (rate limiting)
  timeframes: [number]; // Array of timeframes in milliseconds supported by dataset
};
``;
```

## Examples

For some examples, look at the /src/index.js and /src/onechart.js files. You can toggle between which to load in the index.html file.

## Demo

Also, a public demo is available at [https://viper-beta.netlify.app/](https://viper-beta.netlify.app/)
