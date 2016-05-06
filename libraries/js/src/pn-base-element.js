(function(w) {
    var PnBaseElement = {};
    var elements = {};

    PnBaseElement.createdCallback = function() {
        this.polymerNative = {};
        this.polymerNative.id = polymerNativeClient.utils.getNextId();
        elements[this.polymerNative.id] = this;
    }

    PnBaseElement.attachedCallback = function() {
        this.updateSerializedProperties();
        if (window.polymerNativeHost) {
            polymerNativeHost.createElement(this.polymerNative.serializedProperties);
        }
    }

    PnBaseElement.detachedCallback = function() {
        if (window.polymerNativeHost) {
            polymerNativeHost.removeElement(this.polymerNative.id);
        }
    }

    PnBaseElement.updateSerializedProperties = function() {
        this.polymerNative.serializedProperties = JSON.stringify(polymerNativeClient.utils.getElementProperties(this));
    }

    PnBaseElement.getPNParent = function() {
        var parent = this;

        while (parent) {
            parent = parent.parentNode;

            if (parent && parent.polymerNative) {
                return parent;
            } else if (parent === w.document) {
                return null;
            }
        }
    }

    w.polymerNativeClient.elements = elements;
    w.polymerNativeClient = w.polymerNativeClient || {};
    w.polymerNativeClient.PnBaseElement = PnBaseElement;
}(window));