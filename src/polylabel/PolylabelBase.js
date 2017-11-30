import CONFIG from 'src.config';
import GeoObject from 'GeoObject';
import templateFiltersStorage from 'template.filtersStorage';
import dotColorFilterStorage from 'src.util.templateFilterStorage.dotColor';

export default class PolylabelBased {
    constructor(map) {
        this._map = map;
        templateFiltersStorage.add('dot-color', dotColorFilterStorage);
    }

    getPolylabelType() {
        return this._polylabelType;
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
                const action = event.originalEvent.action;
                action.events.once('tick', this._actionContinuousTickHandler, this);
                break;
            }
        }
    }

    _actionContinuousTickHandler(event) {
        const action = event.get('target');
        const tick = event.get('tick');
        if (tick.zoom !== this._map.getZoom()) {
            this._mapCallback('actionbeginzoomchange');
        }
        action.events.remove('tick', this._actionContinuousTickHandler, this);
    }

    //Возвращает все опции полигона
    getOptions(polygon) {
        if (this.getPolylabelType() === 'collection') {
            return polygon.options.getAll();
        } else {
            return polygon.options;
        }
    }

    //Возвращает опции, которые необходимы для создания подписи
    getConfigOptions(polygon) {
        return CONFIG.options.reduce((result, key) => {
            result[key] = this.getPolylabelType() === 'collection' ? polygon.options.get(key) : polygon.options[key];
            return result;
        }, {});
    }

    //Возвращает опции (тип zoomRange), которые необходимы для создания подписи
    getConfigZoomRangeOptions(polygon) {
        return CONFIG.zoomRangeOptions.reduce((result, key) => {
            result[key] = this.getPolylabelType() === 'collection' ? polygon.options.get(key) : polygon.options[key];
            return result;
        }, {});
    }

     //Возвращает свойства, которые необходимы для создания подписи
    getConfigProperties(polygon) {
        return CONFIG.properties.reduce((result, key) => {
            result[key] = this.getPolylabelType() === 'collection' ?
                polygon.properties.get(key) :
                polygon.properties[key];
                return result;
        }, {});
    }
}
