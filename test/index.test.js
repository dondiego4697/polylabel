describe('util.polylabel', function () {
    var htmlElems;
    var map;

    before(function (done) {
        htmlElems = [];
        var htmlElem = document.createElement('h6');
        htmlElem.innerText = 'asdas';
        htmlElems.push(htmlElem);
        ymaps.ready(['util.polylabel']).then(function () {
            createMap();
            done();
        });
    });

    after(function (done) {
        destroyMap();
        done();
    });

    it('Метка должна быть видна', function () {
        map.geoObjects.add(createGeoObject());
        ymaps.util.polylabel(map.geoObjects, htmlElems, map);
        expect(map.geoObjects.getLength()).to.equal(2);
    });

    it('Метка не должна видна', function () {
        map.setZoom(1).then(function () {
            map.geoObjects.add(createGeoObject());
            ymaps.util.polylabel(map.geoObjects, htmlElems, map);
            expect(map.geoObjects.getLength()).to.equal(1);
        });
    });

    function createMap() {
        map = new ymaps.Map('map', {
            center: [0, 0],
            zoom: 2
        }, {});
    }

    function destroyMap() {
        if (map) {
            map.destroy();
        }
    }

    function createGeoObject() {
        return new ymaps.GeoObject({
            geometry: {
                type: 'Polygon',
                coordinates: [
                    [
                        [73.6, 69.28],
                        [70.73, 92],
                        [57, 92],
                        [57, 35.9],
                        [73.6, 69.28]
                    ]
                ],
                fillRule: 'nonZero'
            }
        }, {});
    }
});
