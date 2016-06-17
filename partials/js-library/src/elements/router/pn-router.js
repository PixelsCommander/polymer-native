var History = require('history');
var PnBaseElement = require('../../pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

//polymerNativeClient should be global to be able to call it from native code
window.polymerNativeClient = window.polymerNativeClient || {};

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
    window.polymerNativeClient.hisory = this.history = window.polymerNativeClient.hisory || History.createHistory();
    this.history.listen(this.onHistoryChanged.bind(this));
}

proto.onHistoryChanged = function (historyState, route) {
    var result = null;
    var routeToActivate = null;

    if (route) {
        result = historyState.hash.match(route.pathRegexp);
        result && result.length && (routeToActivate = route);
    } else if (this.routes) {
        this.routes.forEach(function (route) {
            result = historyState.hash.match(route.pathRegexp);
            result && result.length && (routeToActivate = route);
        });
    }

    routeToActivate && this.activateRoute(routeToActivate);

    this.historyState = historyState;
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
                route.activate();
            }
        } else {
            routeIterator.deactivate();
        }
    });
}

window.polymerNativeClient.back = function () {
    alert('Back');
}

PnUtils.register('router', {
    prototype: proto
});