var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLButtonElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('button', {
    extends: 'button',
    prototype: proto
});