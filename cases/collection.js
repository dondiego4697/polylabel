let collectionTest = function () {
    ymaps.ready(['util.createPolylabel']).then(function () {
        let myMap = createMap();
        ymaps.regions.load('001', {
            lang: 'en',
            quality: 2
        }).then(function (result) {
            let mainObjectCollection = result.geoObjects;
            myMap.geoObjects.add(mainObjectCollection);

            //'<img src="morty.jpg" width=50px height=50px style="border-radius: 3px;">';

            let i = 0;
            mainObjectCollection.options.set({
                labelClassName: {
                    3: 'test-style-1',
                    4: 'test-style-2'
                },
                labelTextSize: 30,
                labelTextColor: {
                    3: 'yellow',
                    4: 'blue'
                }
            });
            mainObjectCollection.each(function (geoObject) {
                if ([0, 1, 2, 3, 6].includes(i)) {
                    geoObject.options.set({
                        labelForceVisible: 'label'
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
                        labelTextSize: 12
                    });
                }
                geoObject.options.set({
                    labelLayout: '<div>{{properties.hintContent}}</div>',
                });
                i++;
            });
            let polyLabeler = new ymaps.util.createPolylabel(myMap, mainObjectCollection);

            mainObjectCollection.events.add('click', function (event) {
                let state = polyLabeler.getLabelState(event.get('target'));
                state.set('visible', polyLabeler.getCurrentVisibility(event.get('target')) === 'dot'
                    ? 'label' : 'dot');
            });

            setTimeout(() => {
                mainObjectCollection.get(0).options.set({
                    labelLayout: '<div>{{geoObject.options.qwe}}{{properties.asd}}</div>',
                    labelTextSize: 80,
                    labelTextColor: 'pink',
                    qwe: 'йопт'
                });
                mainObjectCollection.get(0).properties.set({
                    asd: 'йопт'
                });
            }, 3000);

            /* setTimeout(() => {
                polyLabeler.destroy();
            }, 2000); */
            setTimeout(() => {
                let go = createGeoObject();
                go.options.set({ labelLayout: 'new', labelForceVisible: 'label' });
                mainObjectCollection.add(go);
            }, 3000);
            setTimeout(() => {
                mainObjectCollection.remove(mainObjectCollection.get(0));
            }, 5000);
        });
    });
}
