import CONFIG from 'src.config';
import parseZoomData from 'src.util.zoom.parseZoomData';
import getPolylabelCenter from 'src.util.getPolesOfInaccessibility';
import setZoomVisibility from 'src.util.zoom.setZoomVisibility';
import GeoObject from 'GeoObject';
import transformPolygonCoords from 'src.util.transformPolygonCoords';
import getPolygonWithMaxArea from 'src.util.getPolygonWithMaxArea';

const {
    MIN_ZOOM,
    MAX_ZOOM,
    DEFAULT_POLYGON_FILL_COLOR
} = CONFIG;

export default class LabelData {
    constructor(polygon, options, zoomRangeOptions, map, label) {
        this._map = map;
        this._label = label;
        this._polygon = polygon;
        this._data = {
            zoomInfo: {}, // Объект с информацией для каждого зума
            autoCenter: [0, 0],
            dotVisible: typeof options.labelDotVisible !== 'boolean' ? true : options.labelDotVisible
        };
        this.parsedOptions = LabelData._parseOptions(zoomRangeOptions);
        this._polygonCoordsWithMaxArea = transformPolygonCoords.polygon(getPolygonWithMaxArea(this.getPolygonCoords()));
        this.updateDotDefaultFlag();
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
            this._polygon.geometry.getCoordinates() :
            this._polygon.geometry.coordinates;
    }

    getCenterCoords(zoom) {
        return this.parsedOptions.labelCenterCoords &&
            this.parsedOptions.labelCenterCoords[zoom] || this._data.autoCenter;
    }

    getStyles(zoom) {
        return {
            className: this.parsedOptions.labelClassName && this.parsedOptions.labelClassName[zoom],
            textSize: this.parsedOptions.labelTextSize && this.parsedOptions.labelTextSize[zoom],
            textColor: this.parsedOptions.labelTextColor && this.parsedOptions.labelTextColor[zoom]
        };
    }

    getPolygonFillColor() {
        const color = this._polygon instanceof GeoObject ?
            this._polygon.options.get('fillColor') :
            this._polygon.options.fillColor;
        return color || DEFAULT_POLYGON_FILL_COLOR;
    }

    getDotColorByPolygonColor() {
        let color = this.getPolygonFillColor();
        let checkColor = this._transformHexToRGB(color, 0.9);
        if (checkColor) color = checkColor;
        return color;
    }

    _transformHexToRGB(hex, opacity) {
        hex = hex[0] !== '#' ? `#${hex}` : hex;
        hex = hex.slice(0, 7);
        let c;
        if (!/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) return;

        c = hex.substring(1).split('');
        if(c.length === 3){
            c = [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c = '0x' + c.join('');
        return `rgba(${[ (c>>16)&255, (c>>8)&255, c&255].join(',')}, ${opacity || 1})`;
    }

    getPolygonOptions() {
        return this._polygon instanceof GeoObject ?
            this._polygon.options.getAll() :
            this._polygon.options;
    }

    getVisibility(zoom) {
        return this.parsedOptions.labelForceVisible && this.parsedOptions.labelForceVisible[zoom] ||
            this._data.zoomInfo[zoom].visible;
    }

    getOffset(zoom) {
        return this.parsedOptions.labelOffset && this.parsedOptions.labelOffset[zoom] || [0, 0];
    }

    updateDotDefaultFlag() {
        this.isDotDefault = this.getPolygonOptions().labelDotLayout ? false : true;
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
            transformPolygonCoords.point(this.getCenterCoords(zoom), this._polygonCoordsWithMaxArea.isPositivePart),
            this._polygonCoordsWithMaxArea.coords,
            this.getOffset(zoom),
            this.getPermissibleInaccuracyOfVisibility(zoom)
        );
        if (!zoomData) return;

        this._data.zoomInfo[zoom].visible = zoomData.visible;
        this._data.zoomInfo[zoom][`${type}Size`] = zoomData.size;
    }

    _init() {
        const autoCenter = getPolylabelCenter(this._polygonCoordsWithMaxArea.coords, 1.0);
        this._data.autoCenter = autoCenter;

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
