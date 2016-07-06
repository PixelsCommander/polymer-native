var RebelRoute = require('../../../../../node_modules/rebel-router/es5/rebel-router.js').RebelRoute;
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

var Route = (function (_RebelRoute) {

    Route.prototype = Object.create(_RebelRoute.prototype);
    Route.prototype = Object.assign(Route.prototype, PnBaseElement);

    function Route() {
        return Object.getPrototypeOf(Route).apply(this);
    }

    Route.prototype.createdCallback = function() {
        PnBaseElement.createdCallback.apply(this);
    };

    Route.prototype.attachedCallback = function() {
        PnBaseElement.attachedCallback.call(this);
    };

    return Route;

})(RebelRoute);

PnUtils.register('route', {
    prototype: Route.prototype
});

