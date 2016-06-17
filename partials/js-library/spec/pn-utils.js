var expectedProperties = {
    'id': '0',
    'name': 'PN-VIEW',
    'text': '',
    'src': null,
    'placeholder': null,
    'parentId': null
};

var expectedBounds = {
    left: 100,
    top: 100,
    width: 200,
    height: 200
};

var expectedChildBounds = {
    left: 0,
    top: 0,
    width: 200,
    height: 200
};

describe('polymerNativeClient.utils', function () {

    beforeEach(function(){
        window.polymerNativeClient.utils.dropId();
    });

    it('contains getNextID function which returns new string ID every time', function () {
        var firstId = polymerNativeClient.utils.getNextId();
        var secondId = polymerNativeClient.utils.getNextId();

        expect(firstId).toBe('0');
        expect(secondId).toBe('1');
    });

    it('contains getElementProperties function which returns object with proper fields', function () {
        var element = document.createElement('pn-view');

        setTimeout(function(){
            var properties = polymerNativeClient.utils.getElementProperties(element);
            expect(properties).toEqual(jasmine.objectContaining(expectedProperties));
        }, 0);
    });

    it('getElementProperties calcs correct bounds if there is no parent', function () {
        var element = document.createElement('pn-view');
        element.style.position = 'absolute';
        element.style.top = '100px';
        element.style.left = '100px';
        element.style.width = '200px';
        element.style.height = '200px';

        setTimeout(function () {
            var properties = polymerNativeClient.utils.getElementProperties(element);

            var myRect = {};
            for (var key in properties.bounds) {
                myRect[key] = properties.bounds[key];
            }

            expect(myRect).toEqual(jasmine.objectContaining(expectedBounds));
        }, 0);
    });

    it('getElementProperties calcs correct bounds if there is parent', function () {
        var parentElement = document.createElement('pn-view');
        parentElement.style.position = 'absolute';
        parentElement.style.top = '100px';
        parentElement.style.left = '100px';

        var element = document.createElement('pn-view');
        element.style.position = 'absolute';
        element.style.top = '0px';
        element.style.left = '0px';
        element.style.width = '200px';
        element.style.height = '200px';

        parentElement.appendChild(element);

        setTimeout(function () {
            var properties = polymerNativeClient.utils.getElementProperties(element);

            var myRect = {};
            for (var key in properties.bounds) {
                myRect[key] = properties.bounds[key];
            }

            expect(myRect).toEqual(jasmine.objectContaining(expectedChildBounds));
        }, 0);
    });

    it('contains getElementById function which returns correct element', function () {
        var firstElement = document.createElement('pn-view');
        var secondElement = document.createElement('pn-view');

        setTimeout(function(){
            var foundFirstElement = polymerNativeClient.utils.getElementById('0');
            var foundSecondElement = polymerNativeClient.utils.getElementById('1');

            expect(foundFirstElement).toEqual(firstElement)
            expect(foundSecondElement).toEqual(secondElement)
        }, 0);
    });
});