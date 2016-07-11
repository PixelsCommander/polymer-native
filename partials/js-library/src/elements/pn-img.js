var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLImageElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    PnBaseElement.createdCallback.apply(this);
}

proto.attachedCallback = function () {

    PnBaseElement.attachedCallback.apply(this);
    self.addEventListener('load', PnBaseElement.attachedCallback.bind(this));
}

PnUtils.register('image', {
    extends: 'img',
    prototype: proto
});