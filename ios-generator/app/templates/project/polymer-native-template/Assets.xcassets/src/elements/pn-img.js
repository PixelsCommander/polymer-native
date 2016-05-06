(function(w) {
    var proto = Object.create(HTMLImageElement.prototype);
    proto = Object.assign(proto, w.polymerNativeClient.PnBaseElement);

    w.polymerNativeClient.utils.register('img' , {
        extends: 'img',
        prototype: proto
    });
}(window)
);