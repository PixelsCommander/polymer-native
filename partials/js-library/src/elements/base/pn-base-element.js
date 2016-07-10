var PnBaseElement = {};
var elements = {};

PnBaseElement.createdCallback = function () {
    this.polymerNative = {};
    this.polymerNative.id = polymerNativeClient.utils.getNextId();
    elements[this.polymerNative.id] = this;
}

PnBaseElement.attachedCallback = function () {
    var self = this;
    setTimeout(function () {
        self.updateSerializedProperties();
        if (window.polymerNativeHost) {
            self.style.visibility = 'hidden';
            polymerNativeHost.createElement(self.polymerNative.serializedProperties);
        }
    }, 0);
}

PnBaseElement.detachedCallback = function () {
    if (window.polymerNativeHost) {
        polymerNativeHost.removeElement(this.polymerNative.id);
    }
}

PnBaseElement.update = function (recursive) {
    var self = this;

    setTimeout(function () {
        self.updateSerializedProperties();
        if (window.polymerNativeHost) {
            polymerNativeHost.updateElement(self.polymerNative.serializedProperties);
        }
        if (recursive) {
            for (var i = 0; i < self.childNodes.length; i++) {
                var childNode = self.childNodes[i];
                if (childNode.polymerNative) {
                    childNode.update(recursive);
                }
            }
        }
    }, 0)
}

PnBaseElement.updateSerializedProperties = function () {
    this.polymerNative.serializedProperties = JSON.stringify(polymerNativeClient.utils.getElementProperties(this));
}

PnBaseElement.getPNParent = function () {
    return this.getParent(function(parent){
        return parent && parent.polymerNative;
    });
}

PnBaseElement.getParent = function (predicate) {
    var parent = this;

    while (parent) {
        parent = parent.parentNode;

        if (predicate(parent)) {
            return parent;
        } else if (parent === window.document) {
            return null;
        }
    }
}

window.polymerNativeClient = window.polymerNativeClient || {};
window.polymerNativeClient.elements = elements;
window.polymerNativeClient.PnBaseElement = PnBaseElement;


//Global observers

PnBaseElement.onResize = function () {
    setTimeout(function(){
        for (var elementId in window.polymerNativeClient.elements) {
            var element = window.polymerNativeClient.elements[elementId];
            element.update();
        }
    }, 0);
}

PnBaseElement.onMutations = function (mutations) {
    console.log('Get mutations');
    for (var i = 0; i < mutations.length; i++) {
        var mutation = mutations[i];

        console.log('Mutated ' + mutation.target.tagName);

        var structureChanged = mutation.removedNodes.length || mutation.addedNodes.length;

        if (mutation.target.polymerNative) {
            mutation.target.update(structureChanged);
        }
    }
}

PnBaseElement.initializeObserver = function () {
    var self = this,
        config = {
            childList: true,
            characterData: true,
            subtree: true,
            attributes: true
        };

    this.observer = this.observer || new MutationObserver(PnBaseElement.onMutations);
    this.observer.observe(document.body, config);
}

window.addEventListener('load', PnBaseElement.initializeObserver);
window.addEventListener('orientationchange', PnBaseElement.onResize);

module.exports = PnBaseElement;