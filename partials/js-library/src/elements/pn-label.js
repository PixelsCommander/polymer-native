var PnBaseElement = require('../pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('label', {
    prototype: proto
});