import LabelPlacemarkOverlay from 'src.label.util.LabelPlacemarkOverlay';
import LabelData from 'src.label.LabelData';
import getBaseLayoutTemplates from 'src.label.util.layoutTemplates.getBaseLayoutTemplates';
import createLayoutTemplates from 'src.label.util.layoutTemplates.createLayoutTemplates';

/**
 * Класс подписи полигона для ObjectManager
 */
export default class Label {
    constructor(map, polygon, objectManager) {
        this._map = map;
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
        const baseLayouts = getBaseLayoutTemplates();
        const layouts = createLayoutTemplates(
            this._polygon.options.labelLayout,
            this._polygon.options.labelDotLayout
        );
        ['label', 'dot'].forEach(key => {
            this._placemark[key] = Label._createPlacemark(`${key}#${this._polygon.id}`, {
                properties: Object.assign({}, {
                    labelPolygon: this._polygon
                }, this._polygon.properties),
                options: Object.assign({}, this._polygon.options, layouts[key])
            }, baseLayouts[key]);
        });
    }

    static _createPlacemark(id, params, layout) {
        const options = Object.assign({}, {
            iconLayout: layout,
            iconLabelPosition: 'absolute',
            overlay: LabelPlacemarkOverlay,
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
        };
    }

    _updateOptions(id, options) {
        this._objectManager.objects.setObjectOptions(id, options);
    }

    setLabelData(options, zoomRangeOptions) {
        this._data = new LabelData(this._polygon, options, zoomRangeOptions, this._map, this);
        return this._data;
    }

    getLabelData() {
        return this._data;
    }

    setLayout(type, layout) {
        this._layout[type] = layout;
    }

    /**
     * Устанавливает template для подписи
     */
    setLayoutTemplate() {
        const layouts = createLayoutTemplates(
            this._polygon.options.labelLayout,
            this._polygon.options.labelDotLayout
        );
        
        Object.keys(layouts).forEach(key => {
            this._updateOptions(this._placemark[key].id, layouts[key]);
        });
    }

    setNewOptions(newOptions) {
        ['dot', 'label'].forEach((type) => {
            this._updateOptions(this._placemark[type].id,
                Object.assign({}, this._placemark[type].options, newOptions));
        });
    }

    /**
     * Устанавливает данные подписи на указанный зум и возвращает
     * объект с текущими рассчитанными данными
     */
    setDataByZoom(zoom, types, visibleState) {
        const allData = this._data.getAll();
        let result = {};
        
        types.forEach(type => {
            if (type === 'label') {
                this.setStyles(allData.zoomInfo[zoom].style);
            }
            this._data.setZoomDataForType(type, zoom);
            let {zoomInfo, autoCenter, dotVisible, dotSize} = this._data.getAll();
            zoomInfo = zoomInfo[zoom];
            this.setCoordinates(zoomInfo.center || autoCenter);

            visibleState = visibleState ? visibleState : zoomInfo.visibleForce;
            let visibleType = visibleState === 'auto' ? zoomInfo.visible : visibleState;
            if (visibleType === 'dot' && !dotVisible) {
                visibleType = 'none';
            }
            result = {
                visible: zoomInfo.visible,
                visibleForce: zoomInfo.visibleForce,
                visibleType,
                dotSize,
                zoomInfo
            };
        });

        this.setVisibility(result.visibleType);
        if (['dot', 'label'].indexOf(result.visibleType) !== -1) {
            this.setCenterAndIconShape(result.visibleType,
                result.visibleType === 'dot' ? result.dotSize : result.zoomInfo.labelSize,
                result.zoomInfo.labelOffset);
        }
        return result;
    }

    setCenterAndIconShape(type, size, offset) {
        const h = size.height / 2;
        const w = size.width / 2;

        this._updateOptions(this._placemark[type].id, {
            iconShape: {
                type: 'Rectangle',
                coordinates: [
                    [-w + offset[0], -h + offset[1]],
                    [w + offset[0], h + offset[1]]
                ]
            },
            iconLabelLeft: -w + offset[0],
            iconLabelTop: -h + offset[1]
        });
    }

    /**
     * Устанавливаем координаты
     * Возвращает true - если меняются координаты
     */
    setCoordinates(coords) {
        if (coords.toString() !== this._placemark.label.geometry.coordinates.toString()) {
            ['dot', 'label'].forEach(type => {
                this._objectManager.remove(this._placemark[type]);
                this._generateNewPlacemark(type);
                this._placemark[type].geometry.coordinates = coords;
                this._objectManager.add(this._placemark[type]);
            });
            return true;
        }
        return false;
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
            this._updateOptions(this._placemark[type].id, {pane});
        });
    }

    _generateNewPlacemark(type) {
        this._placemark[type] = Object.assign({}, this._placemark[type]);
        const id = this._placemark[type].id;
        this._placemark[type].id = id[0] === '_' ? id.slice(1) : `_${id}`;
    }
}
