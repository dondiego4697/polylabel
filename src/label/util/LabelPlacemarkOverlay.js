import overlayPlacemark from 'overlay.Placemark';
import OptionManager from 'option.Manager';

export default class LabelPlacemarkOverlay extends overlayPlacemark {
    constructor(geometry, properties, options) {
        super(geometry, properties, options);
    }

    getData() {
        const polygon = this._data.geoObject.properties.get('labelPolygon');
        //debugger;
        return {
            geoObject: polygon,
            geometry: polygon.geometry,
            properties: polygon.properties,
            //options: polygon.options, TODO невозможно переопределить опции, потому что https://github.yandex-team.ru/mapsapi/jsapi-v2/blob/master/src/overlay/view/abstract/baseWithLayout/overlay.view.BaseWithLayout.js#L99
            state: polygon.state
        }
    }
}
