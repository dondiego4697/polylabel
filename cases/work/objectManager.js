let objectManagerTest = function () {
    ymaps.ready(['util.createPolylabel']).then(function () {
        let myMap = createMap();
        ymaps.regions.load('001', {
            lang: 'en',
            quality: 2
        }).then(function (result) {
            let mainObjectCollection = result.geoObjects;
            const objectManager = createOM();
            myMap.geoObjects.add(objectManager);

            let i = 0;
            let polyLabeler = new ymaps.util.createPolylabel(myMap, objectManager);
            mainObjectCollection.each(function (geoObject) {
                geoObject.options.set({
                    labelLayout: '<div>{{properties.hintContent}}</div>',
                    labelClassName: {
                        3: 'test-style-1',
                        '4_5': 'test-style-2'
                    },
                    labelTextSize: 30,
                    labelTextColor: {
                        3: 'yellow',
                        4: 'blue'
                    }
                });

                if ([0, 1, 2, 3, 6].includes(i)) {
                    geoObject.options.set({
                        labelForceVisible: 'label',
                        //labelLayout: '<div>{{properties.hintContent}}</div>'
                        labelLayout: '<img src="/for-dev/morty.jpg" width=50px height=50px style="border-radius: 3px;">'
                    });
                    geoObject.options.set({
                        labelTextColor: {
                            '0_1': 'green',
                            2: 'white'
                        }
                    });
                } else if ([8, 160, 170, 180, 190].includes(i)) {
                    geoObject.options.set({
                        labelCenterCoords: {
                            1: [i - 140, i - 140],
                            '2_100': [i - 200, i - 200],
                        },
                        labelForceVisible: 'label',
                        labelTextSize: 12,
                        labelLayout: '<div>{{properties.hintContent}}</div>'
                    });
                } else {
                    geoObject.options.set({
                        labelPermissibleInaccuracyOfVisibility: {
                            '4_5': 0
                        },
                        labelLayout: '<div>{{properties.hintContent}}</div>',
                    });
                }
                /* geoObject.options.set({
                    labelLayout: '<div>123{{geoObject.options.qweq}}</div>',
                    qweq: i
                }); */
                objectManager.add(transformGOToJSON(geoObject, i));
                i++;
            });
            // objectManager.add(transformToJSON(mainObjectCollection));

            objectManager.events.add('click', (event) => {
                let polygon = objectManager.objects.getById(event.get('objectId'));
                let state = polyLabeler.getLabelState(polygon);
                state.set('visible', polyLabeler.getCurrentVisibility(polygon) === 'dot'
                    ? 'label' : 'dot');
            });

            objectManager.events.add(['labelmouseenter', 'labelmouseleave'], function (event) {
                let polygon = objectManager.objects.getById(event.get('objectId'));
                let state = polyLabeler.getLabelState(polygon);
                state.set('visible', event.get('type') === 'labelmouseleave' ? undefined : 'label');
            });

            setTimeout(() => {
                //1. изменить layout
                /* let polygon = objectManager.objects.getById('polygon0');
                polygon.properties.hintContent = 'asd123';
                objectManager.objects.setObjectOptions(polygon.id, {
                    labelLayout: '<div>{{options.qwe}}{{properties.asd}}</div>',
                    labelDotLayout: '<div>1</div>',
                    labelTextSize: 80,
                    labelTextColor: 'pink',
                    qwe: 'йопт'
                }); */
                setTimeout(() => {
                    //2. изменить опции, которые присутствуют в layout
                    /* mainObjectCollection.get(0).options.set({
                        qwe: 22
                    }); */
                    //3. изменить опции, которые важны для модуля
                    /* mainObjectCollection.get(0).options.set({
                        labelTextSize: 22
                    }); */
                    //4. изменить параметры, которые присутствуют в layout
                    /* mainObjectCollection.get(0).properties.set({
                        asd: 'йопт'
                    }); */
                }, 2000);
            }, 3000);

            /* setTimeout(() => {
                polyLabeler.destroy();
            }, 2000); */
            /* setTimeout(() => {
                let go = createGeoObject();
                go.options.set({ labelLayout: 'new', labelForceVisible: 'label' });
                objectManager.add(transformGOToJSON(go, 9991919));
            }, 3000);
            setTimeout(() => {
                objectManager.remove(objectManager.objects.getById('polygon0'));
            }, 5000); */
        });
    });
}

let transformToJSON = function (collection) {
    let result = {
        type: "FeatureCollection"
    };
    result.features = collection.toArray().map(function (geoObject, i) {
        return transformGOToJSON(geoObject, i);
    });
    return result;
}

let transformGOToJSON = function (geoObject, i) {
    return {
        type: 'Feature',
        id: `polygon${i}`,
        geometry: {
            type: geoObject.geometry.getType(),
            coordinates: geoObject.geometry.getCoordinates()
        },
        options: geoObject.options.getAll(),
        properties: geoObject.properties.getAll()
    }
}
