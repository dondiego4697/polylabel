/*
    ZoomObject: {
        1: some type,
        '3_5': some type
    }
    polygon: {
        options: {
            labelLayout: string | ILayout,
            labelDotLayout: string | ILayout,
            labelTextClassName: ZoomObject | string,
            labelTextColor: ZoomObject | string,
            labelTextSize: ZoomObject | number,
            labelForceVisible: ZoomObject | boolean
        }
        properties: {
            labelCenterCoords: ZoomObject | Array[2]
        }
    }
*/
// case №1 Подписи для полигонов в виде значка погоды с температурой (то, что Котоног выше приводила в пример)
mainObjectCollection.options.set({
    labelLayout: '<div class="weather">{{properties.weatherContent}}</div>'
});
mainObjectCollection.each(function (geoObject) {
    geoObject.properties.set({
        weatherContent: 'norm pogoda' + Math.random()
    });
    // case №2 Показать вместо подписи точку, по ховеру или клику на точку показать подпись
    geoObject.events.add('click', function (event) {
        geoObject.options.set({
            labelLayout: '<div class="labelWeatherDot">{{properties.weatherContent}}</div>'
        });
    }, this);
    // case №3 Показать подпись при ховере на полигон
    geoObject.events.add('mouseenter', function (event) {
        geoObject.options.set({
            labelLayout: '<div class="labelWeatherDot">{{properties.weatherContent}}</div>'
        });
    }, this);
    // case №4 Как настроить разный размер шрифта для полигонов в зависимости от зума.
    geoObject.options.set({
        labelTextSize: {
            1: 11,
            '4-19': 20
        }
    });
    // case №5 Как настроить разный размер шрифта для конкретного полигона в зависимости от зума
    // -- || --
    // case №6 Разный размер подписи в зависимости от размера полигона (показывать максимальную помещающуюся подпись)
});
// case №7 Принудительно включить подписи для всех полигонов
mainObjectCollection.options.set({
    labelForceVisible: true
});
