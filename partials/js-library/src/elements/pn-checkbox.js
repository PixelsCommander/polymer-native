var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLInputElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    PnBaseElement.createdCallback.apply(this);
}

proto.attachedCallback = function () {
    PnBaseElement.attachedCallback.apply(this);
}

proto.setChecked = function (value) {
    this.checked = value;
}

PnUtils.register('checkbox', {
    extends: 'input',
    prototype: proto
});