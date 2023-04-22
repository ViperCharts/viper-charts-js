import EventEmitter from "../../events/event_emitter";

export default class Orders extends EventEmitter {
  constructor() {
    super();

    this.datasets = {};
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
