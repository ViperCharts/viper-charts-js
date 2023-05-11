import EventEmitter from "../../events/event_emitter";

export default class OrdersState extends EventEmitter {
  constructor({ $global }) {
    super();

    this.$global = $global;

    this.datasets = {};
  }

  requestOrdersIfNeeded(timeframeAgnosticDatasetId) {
    if (this.datasets[timeframeAgnosticDatasetId] === undefined) {
      // Assign to null to avoid duplicate requests
      this.datasets[timeframeAgnosticDatasetId] = null;

      // Fire request in background (not depended on it being resolved)
      this.$global.api.onRequestOrders(timeframeAgnosticDatasetId);
    }
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
      price: +price,
      quantity: +quantity,
    };

    // If quantity is 0, remove order
    if (quantity === 0) {
      delete orders[orderId];
    }
  }
}
