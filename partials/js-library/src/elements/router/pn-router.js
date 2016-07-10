var History = require('history');
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

//polymerNativeClient should be global to be able to call it from native code
window.polymerNativeClient = window.polymerNativeClient || {};

var syncingHistoryWithNative = false;
var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    PnBaseElement.createdCallback.apply(this);
    this.activeRoute = null;
    this.initHistory();
}

proto.attachedCallback = function () {
    PnBaseElement.attachedCallback.apply(this);
    this.style.visibility = 'visible';
}

proto.initHistory = function () {
    window.addEventListener('popstate', this.onHistoryChanged.bind(this));
}

proto.onHistoryChanged = function (event) {
    var result = null;
    var routeToActivate = null;

    if (this.routes) {
        this.routes.forEach(function (route) {
            result = location.hash.match(route.pathRegexp);
            result && result.length && (routeToActivate = route);
        });
    }

    routeToActivate && this.activateRoute(routeToActivate);
}

proto.registerRoute = function (route) {
    this.routes = this.routes || [];
    this.routes.push(route);
    this.onHistoryChanged(this.historyState, route);
}

proto.activateRoute = function (route) {
    var self = this;

    this.routes.forEach(function (routeIterator) {
        if (route === routeIterator) {
            if (self.activeRoute !== route) {
                self.activeRoute = route;
                route.activate(syncingHistoryWithNative);
            }
        } else {
            routeIterator.deactivate(syncingHistoryWithNative);
        }
    });
}

window.polymerNativeClient.back = function () {
    syncingHistoryWithNative = true;
    window.history.back();
    setTimeout(function(){
        syncingHistoryWithNative = false;
    }, 0);
}

PnUtils.register('router', {
    prototype: proto
});