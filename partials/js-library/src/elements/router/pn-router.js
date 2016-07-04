var RebelRouter = require('../../../../../../rebel-router/es5/rebel-router.js').RebelRouter;
// var History = require('history');
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

//polymerNativeClient should be global to be able to call it from native code
window.polymerNativeClient = window.polymerNativeClient || {};

var syncingHistoryWithNative = false;

var Router = (function (_RebelRouter) {

    Router.prototype = Object.create(_RebelRouter && _RebelRouter.prototype);

    function Router() {

        return Object.getPrototypeOf(Router).apply(this);
    }

    Router.prototype.createdCallback = function() {
        Object.getPrototypeOf(Router.prototype).createdCallback.call(this, "native");
        PnBaseElement.createdCallback();
    };

    Router.prototype.attachedCallback = function() {
        Object.getPrototypeOf(Router.prototype).attachedCallback.call(this, "native");
        PnBaseElement.attachedCallback();
    };

    return Router;

})(RebelRouter);




// var proto = {};
//
// //Object.create(HTMLElement.prototype);
// proto.prototype = Object.create(RebelRouter && RebelRouter.prototype, { constructor: { value: proto, enumerable: false, writable: true, configurable: true } });
// console.log("PROTO:", proto);
// //proto = Object.assign(proto, PnBaseElement);
// proto.createdCallback = function () {
//     Object.getPrototypeOf(proto.prototype).createdCallback.call(this);
//     //this.prototype.createdCallback.apply(this.prototype);
//     //RebelRouter.createdCallback.apply(this);
//     //this.prototype.createdCallback.apply(this);
//     //console.log();
//     //this.prototype.createdCallback();
//     //console.log("PN CREATED!");
//     //PnBaseElement.createdCallback.apply(this);
//     //this.activeRoute = null;
//     //this.initHistory();
// }
// //
// // proto.attachedCallback = function () {
// //     //PnBaseElement.attachedCallback.apply(this);
// //     //this.style.visibility = 'visible';
// // }
//
// // proto.initHistory = function () {
// //     window.addEventListener('popstate', this.onHistoryChanged.bind(this));
// // }
// //
// // proto.onHistoryChanged = function (historyState, route) {
// //     var result = null;
// //     var routeToActivate = null;
// //
// //     if (route) {
// //         result = location.hash.match(route.pathRegexp);
// //         result && result.length && (routeToActivate = route);
// //     } else if (this.routes) {
// //         this.routes.forEach(function (route) {
// //             result = location.hash.match(route.pathRegexp);
// //             result && result.length && (routeToActivate = route);
// //         });
// //     }
// //
// //     routeToActivate && this.activateRoute(routeToActivate);
// //
// //     this.historyState = historyState;
// // }
// //
// // proto.registerRoute = function (route) {
// //     this.routes = this.routes || [];
// //     this.routes.push(route);
// //     this.onHistoryChanged(this.historyState, route);
// // }
// //
// // proto.activateRoute = function (route) {
// //     var self = this;
// //
// //     this.routes.forEach(function (routeIterator) {
// //         if (route === routeIterator) {
// //             if (self.activeRoute !== route) {
// //                 self.activeRoute = route;
// //                 route.activate(syncingHistoryWithNative);
// //             }
// //         } else {
// //             routeIterator.deactivate(syncingHistoryWithNative);
// //         }
// //     });
// // }

window.polymerNativeClient.back = function () {
    syncingHistoryWithNative = true;
    window.history.back();
    setTimeout(function(){
        syncingHistoryWithNative = false;
    }, 0);
}

PnUtils.register('router', {
    prototype: Router.prototype
});