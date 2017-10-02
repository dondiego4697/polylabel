let objectManagerTest = function () {
    ymaps.ready(['util.createPolylabel']).then(function () {
        let myMap = createMap();
        ymaps.regions.load('001', {
            lang: 'en',
            quality: 2
        }).then(function (result) {
            let mainObjectCollection = result.geoObjects;
            const objectManager = createOM();

            /* var htmlElem = document.createElement('div');
            htmlElem.style.margin = 0;
            htmlElem.innerHTML = '<img src="morty.jpg" width=50px height=50px style="border-radius: 3px;">'; */
            let i = 0;
            mainObjectCollection.each(function (geoObject) {
                if ([0, 1, 2, 3, 6].includes(i)) {
                    //geoObject.options.set('maxFitTextSize', true); // ставится на все зумы, тк чтобы менять размер placemark, его надо при переключении зума менять, перерасчитывать
                    //geoObject.options.set({ labelHtml: '<div style="margin: 0"><img src="../for-dev/morty.jpg" width=40px height=40px style="border-radius: 3px;"></div>' });
                    //geoObject.options.set('preset', 'polylabel#SmallBlackInWhiteOutline');
                    //geoObject.options.set({ labelForceVisibleZoom: true });
                    //geoObject.options.set({ labelForceVisibleZoom: { 0: true, '2_3': false } });
                } else if ([8, 160, 170, 180, 190].includes(i)) {
                    //geoObject.options.set('preset', 'polylabel#Small');
                    /* geoObject.options.set({
                        labelForceVisibleZoom: true
                    });
                    geoObject.properties.set({
                        labelCenterCoords: {
                            1: [i - 140, i - 140],
                            '2_100': [i - 200, i - 200],
                        }
                    }); */
                }
                geoObject.options.set('preset', 'polylabel#BlackInWhiteOutline');
                geoObject.options.set({
                    labelText: geoObject.properties.get('hintContent')
                });
                i++;
            });
            objectManager.add(transformToJSON(mainObjectCollection));
            myMap.geoObjects.add(objectManager);
            /* objectManager.objects.events.add(['labelClick'], function (event) {
                console.log(event);
            }); */
            let polyLabeler = new ymaps.util.createPolylabel(myMap, objectManager);

            /* setTimeout(() => {
                polyLabeler.destroy();
            }, 2000); */
            /*  setTimeout(() => {
                 //mainObjectCollection.get(0).options.set({ labelForceVisibleZoom: true });
                 objectManager.objects.getById(0).options.labelForceVisibleZoom = true;
                 polyLabeler.update();
             }, 2000); */
            /* setTimeout(() => {
                let go = createGeoObject();
                go.options.set({
                    labelText: 'new',
                    preset: 'polylabel#BlackInWhiteOutline',
                    labelForceVisibleZoom: true
                });
                objectManager.add(transforGOToJSON(go, mainObjectCollection.getLength()));
            }, 3000);
            setTimeout(() => {
                objectManager.remove(objectManager.objects.getById(0));
            }, 6000); */
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
