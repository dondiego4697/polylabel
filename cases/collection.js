let collectionTest = function () {
    ymaps.ready(['util.createPolylabel']).then(function () {
        let myMap = createMap();
        ymaps.regions.load('001', {
            lang: 'en',
            quality: 2
        }).then(function (result) {
            //result.geoObjects.options.set({ labelForceVisibleZoom: '1_100' });
            let mainObjectCollection = result.geoObjects;
            myMap.geoObjects.add(mainObjectCollection);

            /* var htmlElem = document.createElement('div');
            htmlElem.style.margin = 0;
            htmlElem.innerHTML = '<img src="morty.jpg" width=50px height=50px style="border-radius: 3px;">'; */

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
                    /* geoObject.options.set({
                        labelForceVisible: true
                    }); */
                    /* geoObject.options.set({
                        labelForceVisible: {
                            0: true,
                            1: true,
                            '2_3': false
                        }
                    }); */
                } else if ([8, 160, 170, 180, 190].includes(i)) {
                    //geoObject.options.set('preset', 'polylabel#SmallWhiteInBlackOutline');
                    //geoObject.options.set('preset', 'polylabel#Small');
                    /*  geoObject.options.set({
                         labelForceVisible: true
                     });
                     geoObject.properties.set({
                         labelCenterCoords: {
                             1: [i - 140, i - 140],
                             '2_100': [i - 200, i - 200],
                         }
                     }); */
                    /* geoObject.properties.set({
                        labelCenterCoords: [i - 140, i - 140]
                    }); */
                }
                geoObject.options.set({
                    //labelHtml: '<div style="margin: 0"><img src="../for-dev/morty.jpg" width=40px height=40px style="border-radius: 3px;"></div>'
                    labelLayout: '<div>{{properties.hintContent}}</div>'
                });
                i++;
            });
            let polyLabeler = new ymaps.util.createPolylabel(myMap, mainObjectCollection);

            mainObjectCollection.get(0).events.add('click', function (event) {
                mainObjectCollection.get(0).options.set({
                    labelLayout: '<div>{{properties.qwe}}</div>',
                    labelTextSize: 80
                });
                mainObjectCollection.get(0).properties.set({
                    qwe: 'йопт'
                });
                // polyLabeler.update();
            }, this);

            /* labelObjectCollection.events.add('click', function (event) {
                console.log(event);
            }, this); */


            /* setTimeout(() => {
                mainObjectCollection.get(0).properties.set({
                    data: 'QQQQQQQQQQQQQQQQQQ'
                });
            }, 3000); */

            /* setTimeout(() => {
                mainObjectCollection.get(0).properties.get('_labelData').label.destroy();
            }, 2000); */
            /* setTimeout(() => {
                polyLabeler.destroy();
            }, 2000); */
            /* setTimeout(() => {
                mainObjectCollection.get(0).options.set({ labelForceVisibleZoom: true });
                polyLabeler.update();
            }, 2000); */
            /* setTimeout(() => {
                let go = createGeoObject();
                go.options.set({ labelText: 'new', preset: 'polylabel#BlackInWhiteOutline', labelForceVisibleZoom: true });
                mainObjectCollection.add(go);
            }, 3000);
            setTimeout(() => {
                mainObjectCollection.remove(mainObjectCollection.get(0));
            }, 6000); */
        });
    });
}
