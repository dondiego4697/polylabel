import CONFIG from 'src.config';
import GeoObject from 'GeoObject';

export default class PolylabelBased {
    constructor(map) {
        this._map = map;
    }

    initMapListeners(callback) {
        this._mapBoundsChangeCallback = callback;
        this._map.events.add('boundschange', this._mapBoundsChangeHandler, this);
    }

    destroyMapListeners() {
        this._map.events.remove('boundschange', this._mapBoundsChangeHandler, this);
    }

    _mapBoundsChangeHandler(event) {
        if (event.get('newZoom') !== event.get('oldZoom')) {
            this._mapBoundsChangeCallback(event.get('newZoom'));
        }
    }

    getOptions(obj) {
        return CONFIG.options.reduce((result, key) => {
            result[key] = obj instanceof GeoObject ? obj.options.get(key) : obj.options[key];
            return result;
        }, {});
    }

    getZoomRangeOptions(obj) {
        return CONFIG.zoomRangeOptions.reduce((result, key) => {
            result[key] = obj instanceof GeoObject ? obj.options.get(key) : obj.options[key];
            return result;
        }, {});
    }

    getProperties(obj) {
        return CONFIG.properties.reduce((result, key) => {
            result[key] = obj instanceof GeoObject ? obj.properties.get(key) : obj.properties[key];
            return result;
        }, {});
    }
}
