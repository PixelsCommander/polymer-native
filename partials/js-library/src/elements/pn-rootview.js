var PnBaseElement = require('../pn-base-element.js');
var PnUtils = require('../pn-utils.js');

window.addEventListener('load', function(){

    var bodyElement = document.body;
    bodyElement.polymerNative = {};
    bodyElement.polymerNative.id = 'root';

    var bodyProps = PnUtils.getElementProperties(bodyElement);
    bodyProps.tagName = 'pn-root';

    console.log('Updating root view');

    if (window.polymerNativeHost) {
        polymerNativeHost.updateElement(JSON.stringify(bodyProps));
    }

    window.polymerNativeClient.elements['root'] = this;
});