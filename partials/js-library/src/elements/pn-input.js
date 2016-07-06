var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLInputElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    PnBaseElement.createdCallback.apply(this);
}

proto.setValue = function (value) {
    this.value = value;
}

PnUtils.register('input', {
    extends: 'input',
    prototype: proto
});