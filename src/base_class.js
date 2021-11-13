import Utils from "./utils";

export default class BaseClass {
  constructor() {
    this._intervals = [];
    this._timeouts = [];
    this._eventListenerCallbacks = {};
    this._onDestroy = [];
  }

  init() {}

  _setTimeout(callback, ms) {
    this._timeouts.push(setTimeout(callback.bind(this), ms));
  }

  _setInterval(callback, ms) {
    this._intervals.push(setInterval(callback.bind(this), ms));
  }

  _addEventListener(object, event, callback) {
    object.addEventListener(event, callback);
    this._eventListenerCallbacks[event] = {
      object,
      callback: callback.bind(this),
    };
  }

  _removeEventListener(event) {
    const { object, callback } = this._eventListenerCallbacks[event];
    if (object) object.removeEventListener(event, callback);
    delete this._eventListenerCallbacks[event];
  }

  destroy() {
    this._intervals.forEach((a) => clearInterval(a));
    this._timeouts.forEach((a) => clearTimeout(a));
    Object.keys(this._eventListenerCallbacks).forEach(
      this._removeEventListener
    );
  }
}
