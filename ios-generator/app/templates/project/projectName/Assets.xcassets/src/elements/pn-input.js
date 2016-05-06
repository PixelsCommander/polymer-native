(function(w) {
    var proto = Object.create(HTMLInputElement.prototype);
    proto = Object.assign(proto, w.polymerNativeClient.PnBaseElement);

    proto.setValue = function(value) {
        this.value = value;
    }

    w.polymerNativeClient.utils.register('input' , {
        extends: 'input',
        prototype: proto
    });
}(window));