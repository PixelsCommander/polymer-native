var RebelRouter = require('../../../../../node_modules/rebel-router/es5/rebel-router.js').RebelRouter;
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
    };

    Router.prototype.attachedCallback = function() {
        PnBaseElement.attachedCallback.apply(this);
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