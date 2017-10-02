import overlayPlacemark from 'overlay.Placemark';

export default class XPlacemark extends overlayPlacemark {
    constructor(geometry, properties, options) {
        super(geometry, properties, options);
    }

    getData() {
        const polygon = this._data.geoObject.properties.get('labelPolygon');
        return {
            geoObject: polygon,
            geometry: polygon.geometry.getCoordinates(),
            properties: polygon.properties,
            state: polygon.state
        }
    }
}
