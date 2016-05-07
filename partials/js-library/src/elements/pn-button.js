(function (w) {
    var proto = Object.create(HTMLButtonElement.prototype);
    proto = Object.assign(proto, w.polymerNativeClient.PnBaseElement);

    w.polymerNativeClient.utils.register('button', {
        extends: 'button',
        prototype: proto
    });
}(window));