export default class EventEmitter {
  _events: { [key: string]: Function[] };

  constructor() {
    this._events = {};
  }

  addEventListener(eventName: string, callback: Function) {
    if (this._events[eventName] !== undefined) {
      this._events[eventName].push(callback);
    } else {
      this._events[eventName] = [callback];
    }
  }

  removeEventListener(eventName: string, callback: Function) {
    const i = this._events[eventName].indexOf(callback);
    if (i === -1) {
      console.error(`Callback not defined on ${eventName}`);
      return;
    }
    this._events[eventName] = this._events[eventName].splice(i, 1);
  }

  fireEvent(eventName: string, ...args: any[]) {
    const listeners = this._events[eventName];
    if (!listeners || !listeners.length) return;
    for (const callback of listeners) {
      callback(...args);
    }
  }
}
