export default {
  /**
   * Price open, high, low, and close
   */
  ohlc: {
    open: "number",
    high: "number",
    low: "number",
    close: "number",
  },

  /**
   * Volume
   */
  volume: {
    volume: "number",
  },

  /**
   * Price open, high, low, close, and volume
   * inherits ohlc and volume
   */
  ohlcv: {
    open: "number",
    high: "number",
    low: "number",
    close: "number",
    volume: "number",
  },

  /**
   * Buy and sell volume
   */
  volumeBySide: {
    buyVolume: "number",
    sellVolume: "number",
  },

  /**
   * Heatmap of historical orderbook
   */
  orderbookHeatmap: {
    spread: "number",
    prices: "object[string]number",
  },
};
