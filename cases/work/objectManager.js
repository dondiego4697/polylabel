let objectManagerTest = function () {
    ymaps.ready(['util.createPolylabel']).then(function () {
        let myMap = createMap();
        ymaps.regions.load('001', {
            lang: 'en',
            quality: 2
        }).then(function (result) {
            let mainObjectCollection = result.geoObjects;
            const objectManager = createOM();

            let i = 0;
            mainObjectCollection.each(function (geoObject) {
                geoObject.options.set({
                    labelText: geoObject.properties.get('hintContent')
                });
            });
            objectManager.add(transformToJSON(mainObjectCollection));
            myMap.geoObjects.add(objectManager);

            let polyLabeler = new ymaps.util.createPolylabel(myMap, objectManager);
        });
    });
}

let transformToJSON = function (collection) {
    let i = -1;
    let result = {
        type: "FeatureCollection"
    };
    result.features = collection.toArray().map(function (geoObject) {
        i++;
        return transformGOToJSON(geoObject, i);
    });
    return result;
}

let transformGOToJSON = function (geoObject, i) {
    return {
        type: 'Feature',
        id: i++,
        geometry: {
            type: geoObject.geometry.getType(),
            coordinates: geoObject.geometry.getCoordinates()
        },
        options: geoObject.options.getAll(),
        properties: geoObject.properties.getAll()
    }
}
