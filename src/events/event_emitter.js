import Utils from "../utils";

export default class EventEmitter {
  constructor() {
    this._events = {};
  }

  addEventListener(eventName, callback) {
    const id = Utils.uniqueId();
    if (this._events[eventName] !== undefined) {
      this._events[eventName].push(callback);
    } else {
      this._events[eventName] = [callback];
    }
    return id;
  }

  removeEventListener(eventName, callback) {
    const listener = this._events[eventName];
    if (!listener) return;
    const i = listener.indexOf(callback);
    if (i === -1) {
      console.log("Error!!! " + eventName);
      return;
    }
    listener.splice(i, 1);
  }

  fireEvent(eventName, ...args) {
    const listeners = Object.values(this._events[eventName] || {});
    if (!listeners || !listeners.length) return;
    for (const callback of listeners) {
      callback(...args);
    }
  }
}
