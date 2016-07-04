var pathToRegexp = require('path-to-regexp');
var PnBaseElement = require('../base/pn-base-element.js');
var PnUtils = require('../../pn-utils.js');

// var proto = Object.create(HTMLDivElement.prototype);
// proto = Object.assign(proto, PnBaseElement);
//
// proto.createdCallback = function () {
//     PnBaseElement.createdCallback.apply(this);
//
//     var self = this;
//     this.activationPromise = new Promise(function(resolve, reject) {
//         self.activationPromiseResolve = resolve;
//     });
// }
//
// proto.attachedCallback = function () {
//     PnBaseElement.attachedCallback.apply(this);
//     //this.style.visibility = 'visible';
//
//     this.initPathRegexp();
//     this.router = this.findRouter();
//     this.router.registerRoute(this);
//
//     var self = this;
//
//     setTimeout(function(){
//         self.activationPromiseResolve();
//     }, 100);
// }
//
// proto.activate = function (skipNative) {
//     var self = this;
//
//     this.activationPromise.then(function(){
//         console.log('Activating ' + self.id + ' , skipping native = ' + skipNative);
//         if (window.polymerNativeHost) {
//             if (!skipNative) {
//                 window.polymerNativeHost.activateRoute(self.polymerNative.id);
//             }
//         } else {
//             self.style.visibility = 'visible';
//         }
//     });
// }
//
// proto.deactivate = function (skipNative) {
//     console.log('Deactivating ' + this.id + ' , skipping native = ' + skipNative);
//     if (!window.polymerNativeHost && !skipNative) {
//         this.style.visibility = 'hidden';
//     }
// }
//
// proto.initPathRegexp = function () {
//     var path = this.getAttribute('path');
//
//     if (path) {
//         this.pathRegexp = pathToRegexp(path);
//     }
// }
//
// proto.findRouter = function () {
//     var parent = this;
//
//     while (parent) {
//         parent = parent.parentNode;
//
//         if (parent && parent.tagName.toLowerCase() === 'native-router') {
//             return parent;
//         } else if (parent === window.document) {
//             return null;
//         }
//     }
// }

// PnUtils.register('route', {
//     prototype: proto
// });