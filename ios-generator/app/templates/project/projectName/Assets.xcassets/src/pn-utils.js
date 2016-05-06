(function (w) {
    var polymerNativeObjectId = 0;

    var utils = {

        dropId: function() {
            polymerNativeObjectId = 0;
        },

        getNextId: function () {
            return polymerNativeObjectId++ + '';
        },

        getElementProperties: function (element) {
            var id = element.polymerNative.id;
            var name = element.getAttribute('is') || element.tagName;
            var parent = element.getPNParent();
            var parentId = parent ? parent.polymerNative.id : null;
            var bounds = element.getBoundingClientRect();
            var style = window.getComputedStyle(element);
            var text = element.textContent;
            var src = element.getAttribute('src');
            var value = element.value;
            var placeholder = element.getAttribute('placeholder');

            if (parent) {
                var parentBounds = element.getBoundingClientRect();
                bounds = {
                    width: bounds.width,
                    height: bounds.height,
                    left: bounds.left - parentBounds.left,
                    top: bounds.top - parentBounds.top
                }
            }

            return {
                id: id,
                name: name,
                bounds: bounds,
                style: style,
                text: text,
                src: src,
                value: value,
                placeholder: placeholder,
                parentId: parentId
            }
        },

        getElementById: function (elementId) {
            return polymerNativeClient.elements[elementId];
        },

        callMethod: function (elementId, methodName, argument) {
            var element = w.polymerNativeClient.utils.getElementById(elementId);
            element[methodName].call(element, argument);
        },

        dispatchEvent: function (elementId, eventName, data) {
            var element = w.polymerNativeClient.utils.getElementById(elementId);
            w.polymerNativeClient.utils.fireEvent(element, eventName);
        },

        fireEvent: function (node, eventName) {
            // Make sure we use the ownerDocument from the provided node to avoid cross-window problems
            var doc;
            if (node.ownerDocument) {
                doc = node.ownerDocument;
            } else if (node.nodeType == 9) {
                // the node may be the document itself, nodeType 9 = DOCUMENT_NODE
                doc = node;
            } else {
                throw new Error("Invalid node passed to fireEvent: " + node.id);
            }

            if (node.dispatchEvent) {
                // Gecko-style approach (now the standard) takes more work
                var eventClass = "";

                // Different events have different event classes.
                // If this switch statement can't map an eventName to an eventClass,
                // the event firing is going to fail.
                switch (eventName) {
                    case "click": // Dispatching of 'click' appears to not work correctly in Safari. Use 'mousedown' or 'mouseup' instead.
                    case "mousedown":
                    case "mouseup":
                        eventClass = "MouseEvents";
                        break;

                    case "focus":
                    case "change":
                    case "blur":
                    case "select":
                        eventClass = "HTMLEvents";
                        break;

                    default:
                        throw "fireEvent: Couldn't find an event class for event '" + eventName + "'.";
                        break;
                }
                var event = doc.createEvent(eventClass);
                event.initEvent(eventName, true, true); // All events created as bubbling and cancelable.

                event.synthetic = true; // allow detection of synthetic events
                // The second parameter says go ahead with the default action
                node.dispatchEvent(event, true);
            } else if (node.fireEvent) {
                // IE-old school style
                var event = doc.createEventObject();
                event.synthetic = true; // allow detection of synthetic events
                node.fireEvent("on" + eventName, event);
            }
        },
        register: function(name, properties) {
            //document.registerElement('native-' + name, properties);
            document.registerElement('pn-' + name, properties);
        }
    };


    w.polymerNativeClient = w.polymerNativeClient || {};
    w.polymerNativeClient.utils = utils;
    w.polymerNativeClient.dispatchEvent = utils.dispatchEvent;
    w.polymerNativeClient.callMethod = utils.callMethod;

    if (w.polymerNativeHost) {
        w.alert = polymerNativeHost.alert;
    }
})(window);

if (typeof Object.assign != 'function') {
    (function () {
        Object.assign = function (target) {
            'use strict';
            if (target === undefined || target === null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }

            var output = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source !== undefined && source !== null) {
                    for (var nextKey in source) {
                        if (source.hasOwnProperty(nextKey)) {
                            output[nextKey] = source[nextKey];
                        }
                    }
                }
            }
            return output;
        };
    })();
}