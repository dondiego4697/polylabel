describe('util.polylabel', function () {
    let htmlElem;
    let map;
    let mainObjectCollection;

    before(function (done) {
        var htmlElem = document.createElement('h6');
        htmlElem.style.margin = 0;
        htmlElem.innerText = '1';
        ymaps.ready(['util.polylabel']).then(function () {
            createMap();
            createCollections();
            done();
        });
    });

    after(function (done) {
        destroyMap();
        done();
    });

    it('Метка должна быть видна', function (done) {
        let GO = createGeoObject();
        GO.options.set({ labelHtml: htmlElem });
        mainObjectCollection.add(GO);
        new ymaps.util.polylabel(map, mainObjectCollection);
        console.log(map.geoObjects.get(0).getLength());
        done();
        //expect(map.geoObjects.getLength()).to.equal(2);
    });

    function createGeoObject() {
        return new ymaps.GeoObject(
            {
                geometry: {
                    type: 'Polygon',
                    coordinates: [
                        [
                            [55.75, 37.80],
                            [55.80, 37.90],
                            [55.75, 38.00],
                            [55.70, 38.00],
                            [55.70, 37.80]
                        ]
                    ],
                    fillRule: 'nonZero'
                },
                properties: {}
            },
            {
                fillColor: '#ffff0022',
                strokeColor: '#3caa3c88',
                strokeWidth: 7
            });
    }

    function createCollections() {
        mainObjectCollection = new ymaps.GeoObjectCollection();
        map.geoObjects.add(mainObjectCollection);
    }

    function createMap() {
        map = new ymaps.Map('map', {
            center: [0, 0],
            zoom: 10
        }, {});
    }

    function destroyMap() {
        if (map) {
            map.destroy();
        }
    }
});
