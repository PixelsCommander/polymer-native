(function(w) {
    var proto = Object.create(HTMLDivElement.prototype);
    proto = Object.assign(proto, w.polymerNativeClient.PnBaseElement);

    w.polymerNativeClient.utils.register('view' , {
        extends: 'div',
        prototype: proto
    });
}(window));