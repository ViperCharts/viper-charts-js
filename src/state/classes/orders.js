import EventEmitter from "../../events/event_emitter";

export default class OrdersState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.datasets = {};

    this.addOrUpdateOrder("BINANCE:BTCUSDT", {
      orderId: 1,
      side: "buy",
      price: 27000,
      quantity: 0.097,
    });
    this.addOrUpdateOrder("BINANCE:BTCUSDT", {
      orderId: 2,
      side: "sell",
      price: 28000,
      quantity: 0.04,
    });
    this.addOrUpdateOrder("BINANCE:BTCUSDT", {
      orderId: 3,
      side: "sell",
      price: 290000,
      quantity: 0.3,
    });
    this.addOrUpdateOrder("BINANCE:BTCUSDT", {
      orderId: 4,
      side: "sell",
      price: 30000,
      quantity: 1.1,
    });
  }

  addOrUpdateOrder(
    timeframeAgnosticDatasetId,
    { orderId, side, price, quantity }
  ) {
    let orders = this.datasets[timeframeAgnosticDatasetId];
    if (!orders) {
      orders = {};
      this.datasets[timeframeAgnosticDatasetId] = orders;
    }

    // Add or update order
    orders[orderId] = {
      orderId,
      side,
      price,
      quantity,
    };

    // If quantity is 0, remove order
    if (quantity === 0) {
      delete orders[orderId];
    }
  }
}

/**
 * Represents a single limit order for a dataset
 * @param {string} id
 * @param {'buy'|'sell'} side
 * @param {number} price
 * @param {number} quantity
 */
