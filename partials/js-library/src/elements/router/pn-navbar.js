var pathToRegexp = require('path-to-regexp');
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

var proto = Object.create(HTMLDivElement.prototype);
proto = Object.assign(proto, PnBaseElement);

proto.createdCallback = function () {
    PnBaseElement.createdCallback.apply(this);
    //this.style.display = 'none';
}

PnUtils.register('navbar', {
    prototype: proto
});