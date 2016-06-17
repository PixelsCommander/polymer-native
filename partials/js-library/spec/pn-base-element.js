var expectedProperties = {
    'id': '0',
    'name': 'PN-VIEW',
    'text': '',
    'src': null,
    'placeholder': null,
    'parentId': null
};

describe('PNBaseElement', function () {

    beforeEach(function(){
        window.polymerNativeClient.utils.dropId();
    });

    it('have correct polymerNative.id after created', function () {
        var element = document.createElement('pn-view');

        setTimeout(function(){
            expect(element.polymerNative).toBeDefined();
            expect(element.polymerNative.id).toBe('0');
        }, 0);
    });

    it('fills in polymerNative.serializedProperties after being appended', function () {
        var element = document.createElement('pn-view');
        document.body.appendChild(element);

        setTimeout(function(){
            expect(element.polymerNative.serializedProperties).toBeDefined();
            expect(element.polymerNative.serializedProperties).toEqual(jasmine.objectContaining(expectedProperties));
        }, 0);
    });
});