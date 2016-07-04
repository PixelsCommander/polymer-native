var RebelRouter = require('../../../../../../rebel-router/es5/rebel-router.js').RebelRouter;
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

//polymerNativeClient should be global to be able to call it from native code
window.polymerNativeClient = window.polymerNativeClient || {};

var Router = (function (_RebelRouter) {

    Router.prototype = Object.create(_RebelRouter.prototype);
    Router.prototype = Object.assign(Router.prototype, PnBaseElement);

    function Router() {
        return Object.getPrototypeOf(Router).apply(this);
    }

    Router.prototype.createdCallback = function() {
        PnBaseElement.createdCallback.apply(this);
        Object.getPrototypeOf(Router.prototype).createdCallback.call(this, "native");
        if (this.routes !== undefined && Object.keys(this.routes).length !== 0) {
            for (var path in this.routes) {
                PnBaseElement.createdCallback.call(this.routes[path]);
            }
        }
    };

    Router.prototype.attachedCallback = function() {
        PnBaseElement.attachedCallback.call(this);
        if (window.polymerNativeHost) {
            var $scope = this;
            _RebelRouter.pathChange(function () {
                var _current = $scope.current();
                if (_current !== null && _current.polymerNative !== undefined) {
                    window.polymerNativeHost.activateRoute(_current.polymerNative.id);
                }
            });
        }
    };

    return Router;

})(RebelRouter);

//Not sure what this is for?
var syncingHistoryWithNative = false;
window.polymerNativeClient.back = function () {
    syncingHistoryWithNative = true;
    window.history.back();
    setTimeout(function(){
        syncingHistoryWithNative = false;
    }, 0);
};

PnUtils.register('router', {
    prototype: Router.prototype
});