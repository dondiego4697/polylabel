import CONFIG from 'src.config';
import parseZoomData from 'src.util.zoom.parseZoomData';
import getPolylabelCenter from 'src.util.getPolesOfInaccessibility';
import setZoomVisibility from 'src.util.zoom.setZoomVisibility';
import GeoObject from 'GeoObject';

const {
    MIN_ZOOM,
    MAX_ZOOM
} = CONFIG;

export default class LabelData {
    constructor(polygon, options, zoomRangeOptions, map, label) {
        this._map = map;
        this._label = label;
        this._polygon = polygon;
        this._data = {
            zoomInfo: {}, // Объект с информацией для каждого зума
            autoCenter: [0, 0],
            polygonIndex: 0,
            dotVisible: typeof options.labelDotVisible !== 'boolean' ? true : options.labelDotVisible
        };
        this.parsedOptions = LabelData._parseOptions(zoomRangeOptions);
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

    getPolygonCoords() {
        return this._polygon instanceof GeoObject ?
            this._polygon.geometry.getCoordinates()[this._data.polygonIndex] :
            this._polygon.geometry.coordinates[this._data.polygonIndex];
    }

    getCenterCoords(zoom) {
        return this.parsedOptions.labelCenterCoords && this.parsedOptions.labelCenterCoords[zoom] || this._data.autoCenter;
    }

    getStyles(zoom) {
        return {
            className: this.parsedOptions.labelClassName && this.parsedOptions.labelClassName[zoom],
            textSize: this.parsedOptions.labelTextSize && this.parsedOptions.labelTextSize[zoom],
            textColor: this.parsedOptions.labelTextColor && this.parsedOptions.labelTextColor[zoom]
        }
    }

    getVisibility(zoom) {
        return this.parsedOptions.labelForceVisible && this.parsedOptions.labelForceVisible[zoom] ||
            this._data.zoomInfo[zoom].visible;
    }

    getOffset(zoom) {
        return this.parsedOptions.labelOffset && this.parsedOptions.labelOffset[zoom] || [0, 0];
    }

    getPermissibleInaccuracyOfVisibility(zoom) {
        return this.parsedOptions.labelPermissibleInaccuracyOfVisibility &&
            this.parsedOptions.labelPermissibleInaccuracyOfVisibility[zoom] || 0;
    }

    getSize(zoom, type) {
        return this._data.zoomInfo[zoom][`${type}Size`];        
    }

    setVisible(zoom, type, layout) {
        if (this._data.zoomInfo[zoom][`${type}Size`]) return;

        const zoomData = setZoomVisibility(
            type,
            this._map,
            zoom,
            this._data.zoomInfo[zoom].visible,
            layout,
            this.getCenterCoords(zoom),
            this.getPolygonCoords(),
            this.getOffset(zoom),
            this.getPermissibleInaccuracyOfVisibility(zoom)
        );
        if (!zoomData) return;

        this._data.zoomInfo[zoom].visible = zoomData.visible;
        this._data.zoomInfo[zoom][`${type}Size`] = zoomData.size;
    }

    _init() {
        const coordinates =  this._polygon instanceof GeoObject ?
            this._polygon.geometry.getCoordinates() :
            this._polygon.geometry.coordinates;

        const autoCenterData = getPolylabelCenter(coordinates, 1.0);
        this._data.autoCenter = autoCenterData.center;
        this._data.polygonIndex = autoCenterData.index;

        for (let z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
            this._data.zoomInfo[z] = LabelData._createDefaultZoomInfo(z);
        }
    }

    static _parseOptions(options) {
        let result = {};
        Object.keys(options).forEach(key => {
            result[key] = parseZoomData(options[key]);
        });
        return result;
    }

    static _createDefaultZoomInfo() {
        return {
            visible: 'none', // label | dot | none,
            dotSize: undefined,
            labelSize: undefined
        };
    }
}
