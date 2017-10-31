import CONFIG from 'src.config';
import parseZoomData from 'src.util.zoom.parseZoomData';
import getPolylabelCenter from 'src.util.getPolesOfInaccessibility';
import GeoObject from 'GeoObject';
import setOneZoomVisibility from 'src.util.zoom.setOneZoomVisibility';

const {
    MIN_ZOOM,
    MAX_ZOOM
} = CONFIG;

export default class LabelData {
    constructor(polygon, options, zoomRangeOptions, map, labelInst) {
        this._map = map;
        this._labelInst = labelInst;
        this._polygon = polygon;
        this._data = {
            zoomInfo: {}, // Объект с информацией для каждого зума
            autoCenter: [0, 0],
            polygonIndex: 0,
            dotSize: {
                height: 0,
                width: 0
            },
            dotFirstZoom: undefined,
            dotVisible: typeof options.labelDotVisible !== 'boolean' ? true : options.labelDotVisible
        };
        this._parsedOptions = this._parseOptions(zoomRangeOptions);
        this._init();
    }

    setData(key, val) {
        this._data[key] = val;
    }

    getData(key) {
        return this._data[key];
    }

    setZoomInfo(zoom, key, value) {
        this._data.zoomInfo[zoom][key] = value;
    }

    getZoomInfo(zoom) {
        if (zoom || typeof zoom === 'number' && zoom === 0) {
            return this._data.zoomInfo[zoom];
        }
        return this._data.zoomInfo;
    }

    getAll() {
        return this._data;
    }

    getPolygonCoords() {
        const geometry = this._polygon.geometry;
        return this._polygon instanceof GeoObject ?
            geometry.getCoordinates()[this._data.polygonIndex] :
            geometry.coordinates[this._data.polygonIndex];
    }

    /**
     * Проверяет, есть ли данные на текущий зум, рассчитывает все и устанавливает
     */
    setZoomData(zoom) {
        if (this._data.zoomInfo[zoom].isCalculated !== 2) {
            setOneZoomVisibility(this._map, zoom, this._labelInst, 'dot');
            setOneZoomVisibility(this._map, zoom, this._labelInst, 'label');
            this._data.zoomInfo[zoom].isCalculated = 2;
        }
    }

    setZoomDataForType(type, zoom) {
        if (this._data.zoomInfo[zoom].isCalculated !== 2) {
            setOneZoomVisibility(this._map, zoom, this._labelInst, type);
            this._data.zoomInfo[zoom].isCalculated++;
        }
    }

    _init() {
        const geometry = this._polygon.geometry;
        const coordinates = this._polygon instanceof GeoObject ?
            geometry.getCoordinates() :
            geometry.coordinates;
        const autoCenterData = getPolylabelCenter(coordinates, 1.0);
        this._data.autoCenter = autoCenterData.center;
        this._data.polygonIndex = autoCenterData.index;

        for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
            this._data.zoomInfo[z] = this._fillZoom(z);
        }
    }

    _fillZoom(zoom) {
        let zoomInfo = this._createDefaultZoomInfo();
        this._setData(zoomInfo, 'visibleForce', this._parsedOptions.labelForceVisible, zoom);

        this._setData(zoomInfo, 'center', this._parsedOptions.labelCenterCoords, zoom);
        this._setData(zoomInfo, 'labelOffset', this._parsedOptions.labelOffset, zoom);
        this._setData(zoomInfo, 'permissibleInaccuracyOfVisibility',
            this._parsedOptions.labelPermissibleInaccuracyOfVisibility, zoom);

        this._setData(zoomInfo, 'style.className', this._parsedOptions.labelClassName, zoom);
        this._setData(zoomInfo, 'style.textSize', this._parsedOptions.labelTextSize, zoom);
        this._setData(zoomInfo, 'style.textColor', this._parsedOptions.labelTextColor, zoom);
        return zoomInfo;
    }

    _setData(target, key, data, zoom) {
        let path = key.split('.');
        if (data && data[zoom]) {
            set(path, target);
        }
        function set(path, target) {
            if (path.length > 1) {
                set(path.slice(1), target[path[0]]);
            } else {
                target[path[0]] = data[zoom];
            }
        }
    }

    _parseOptions(options) {
        let result = {};
        Object.keys(options).forEach(key => {
            result[key] = parseZoomData(options[key]);
        });
        return result;
    }

    _createDefaultZoomInfo() {
        return {
            isCalculated: 0,
            visible: 'none', // label | dot | none
            visibleForce: 'auto', // label | dot | none | auto
            center: undefined,
            style: {
                className: undefined,
                textSize: undefined,
                textColor: undefined
            },
            labelSize: {
                height: 0,
                width: 0
            },
            labelOffset: [0, 0],
            permissibleInaccuracyOfVisibility: 0
        };
    }
}
