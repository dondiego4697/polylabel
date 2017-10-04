import overlayPlacemark from 'overlay.Placemark';

export default class XPlacemark extends overlayPlacemark {
    constructor(geometry, properties, options) {
        super(geometry, properties, options);
    }

    getData() {
        const polygon = this._data.geoObject.properties.get('_labelPolygon');
        if (polygon.options.get('labelLayout').indexOf('qweqwe') !== -1) {
            debugger;
        }
        return {
            geoObject: polygon,
            geometry: polygon.geometry,
            properties: polygon.properties,
            options: polygon.options,
            state: polygon.state
        }
    }
}
