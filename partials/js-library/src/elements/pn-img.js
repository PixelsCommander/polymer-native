var PnBaseElement = require('./base/pn-base-element.js');
var PnUtils = require('../pn-utils.js');

var proto = Object.create(HTMLImageElement.prototype);
proto = Object.assign(proto, PnBaseElement);

PnUtils.register('img', {
    extends: 'img',
    prototype: proto
});