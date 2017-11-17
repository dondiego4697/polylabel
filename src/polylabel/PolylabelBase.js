import CONFIG from 'src.config';
import GeoObject from 'GeoObject';

export default class PolylabelBased {
    constructor(map) {
        this._map = map;
    }

    initMapListeners(callback) {
        this._mapCallback = callback;
        this._map.events.add(['boundschange', 'actionbegin'], this._mapEventsHandler, this);
    }

    destroyMapListeners() {
        this._map.events.remove(['boundschange', 'actionbegin'], this._mapEventsHandler, this);
    }

    _mapEventsHandler(event) {
        switch (event.get('type')) {
            case 'boundschange': {
                if (event.get('newZoom') !== event.get('oldZoom')) {
                    this._mapCallback('boundschange');
                }
                break;
            }
            case 'actionbegin': {
                //TODO тут надо определить какое событие пошло
                this._mapCallback('');
                break;
            }
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
