import Utils from "../utils";

export default class EventEmitter {
  _events: {
    [key: string]: {
      [key: string]: Function;
    };
  };

  constructor() {
    this._events = {};
  }

  addEventListener(eventName: string, callback: Function) {
    const id = Utils.uniqueId();
    if (this._events[eventName] !== undefined) {
      this._events[eventName][id] = callback;
    } else {
      this._events[eventName] = { [id]: callback };
    }
    return id;
  }

  removeEventListener(eventName: string, id: string) {
    const listener = this._events[eventName][id];
    if (!listener) {
      console.error(`Listener id (${id}) not found on ${eventName}`);
      return;
    }
    delete this._events[eventName][id];
  }

  fireEvent(eventName: string, ...args: any[]) {
    const listeners = Object.values(this._events[eventName] || {});
    if (!listeners || !listeners.length) return;
    for (const callback of listeners) {
      callback(...args);
    }
  }
}
