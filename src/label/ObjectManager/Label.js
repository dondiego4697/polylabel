import Placemark from 'Placemark';
import LabelPlacemarkOverlay from 'src.label.util.LabelPlacemarkOverlay';
import createLabelLayoutTemplate from 'src.label.util.createLabelLayoutTemplate';
import createDotLayoutTemplate from 'src.label.util.createDotLayoutTemplate';
import LabelData from 'src.label.LabelData';
import getLayoutTemplate from 'src.label.util.getLayoutTemplate';

/**
 * Класс подписи полигона для ObjectManager
 */
export default class Label {
    constructor(polygon, objectManager, layoutTemplateCache) {
        this._polygon = polygon;
        this._objectManager = objectManager;
        this._placemark = {
            label: null,
            dot: null
        };
        this._layout = {
            label: null,
            dot: null
        };
        this._layoutTemplateCache = layoutTemplateCache;
        this._init();
    }

    destroy() {
        this.removeFromCollection();
    }

    getPlacemark(type) {
        return this._placemark[type];
    }

    getLayout(type) {
        return this._layout[type];
    }

    addToObjectManager() {
        ['label', 'dot'].forEach(type => {
            this._objectManager.add(this._placemark[type]);
        });
    }

    removeFromCollection() {
        ['label', 'dot'].forEach(type => {
            this._objectManager.remove(this._placemark[type]);
        });
        this._polygon = null;
        this._objectManager = null;
        this._placemark = null;
        this._layout = null;
        this._data = null;
    }

    _init() {
        const { labelLayout, labelDotLayout } = getLayoutTemplate(this._polygon.options, this._layoutTemplateCache);
        const layout = {
            label: labelLayout,
            dot: labelDotLayout
        };
        ['label', 'dot'].forEach(key => {
            this._placemark[key] = Label._createPlacemark(`${key}#${this._polygon.id}`, {
                properties: Object.assign({}, {
                    'labelPolygon': this._polygon
                }, this._polygon.properties),
                options: this._polygon.options
            }, layout[key]);
        });
    }

    static _createPlacemark(id, params, layout) {
        //TODO должны пробрасоваться properties в placemark!!!!!!!!!!!!
        const options = Object.assign({}, {
            iconLayout: layout,
            iconLabelPosition: 'absolute',
            //pointOverlay: LabelPlacemarkOverlay,
            pane: 'phantom'
        }, params.options);
        return {
            type: 'Feature',
            id,
            options,
            properties: params.properties,
            geometry: {
                type: 'Point',
                coordinates: [0, 0]
            }
        }
    }

    _updateOptions(id, options) {
        this._objectManager.objects.setObjectOptions(id, options);
    }

    setLabelData(options, zoomRangeOptions) {
        this._data = new LabelData(this._polygon, options, zoomRangeOptions);
        return this._data;
    }

    getLabelData() {
        return this._data;
    }

    setLayout(type, layout) {
        this._layout[type] = layout;
    }

    setDataByZoom(zoom, visibleState) {
        let { zoomInfo, autoCenter, dotVisible, dotSize } = this._data.getAll();
        zoomInfo = zoomInfo[zoom];
        this.setCoordinates(zoomInfo.center || autoCenter);
        visibleState = visibleState ? visibleState : zoomInfo.visibleForce;
        let visibleType = visibleState === 'auto' ? zoomInfo.visible : visibleState;
        if (visibleType === 'dot' && !dotVisible) {
            visibleType = 'none';
        }
        this.setVisibility(visibleType);

        if (['dot', 'label'].indexOf(visibleType) !== -1) {
            this.setCenterAndIconShape(visibleType,
                visibleType === 'dot' ? dotSize : zoomInfo.labelSize,
                zoomInfo.labelOffset);
        }
        this.setStyles(zoomInfo.style);
        return {
            visible: zoomInfo.visible,
            visibleForce: zoomInfo.visibleForce,
            visibleType
        }
    }

    setCenterAndIconShape(type, size, offset) {
        const h = size.height / 2;
        const w = size.width / 2;

        this._updateOptions(this._placemark[type].id, {
            iconShape: {
                type: 'Rectangle',
                coordinates: [
                    [-w + offset[1], -h + offset[0]],
                    [w + offset[1], h + offset[0]]
                ]
            },
            iconLabelTop: -h + offset[0],
            iconLabelLeft: -w + offset[1]
        });
    }

    setCoordinates(coords) {
        if (coords.toString() !== this._placemark.label.geometry.coordinates.toString()) {
            ['dot', 'label'].forEach(type => {
                this._objectManager.remove(this._placemark[type]);
                this._generateNewPlacemark(type);
                this._placemark[type].geometry.coordinates = coords;
                this._objectManager.add(this._placemark[type]);
            });
        }
    }

    setStyles(data) {
        this._updateOptions(this._placemark.label.id, {
            iconLabelClassName: data.className,
            iconLabelTextSize: data.textSize,
            iconLabelTextColor: data.textColor
        });
    }

    setVisibility(visibleType) {
        Object.keys(this._placemark).forEach(type => {
            const pane = type === visibleType ? 'places' : 'phantom';
            this._updateOptions(this._placemark[type].id, { pane });
        });
    }

    _generateNewPlacemark(type) {
        this._placemark[type] = Object.assign({}, this._placemark[type]);
        const id = this._placemark[type].id;
        this._placemark[type].id = id[0] === '_' ? id.slice(1) : `_${id}`;
    }
}
