import Placemark from 'Placemark';
import LabelPlacemarkOverlay from 'src.label.util.LabelPlacemarkOverlay';
import LabelData from 'src.label.LabelData';
import getLayoutTemplate from 'src.label.util.getLayoutTemplate';

/**
 * Класс подписи полигона для геоколлекции
 */
export default class Label {
    constructor(map, polygon, parentCollection, layoutTemplateCache) {
        this._map = map;
        this._polygon = polygon;
        this._parentCollection = parentCollection;
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

    /**
     * Устанавливает данные о подписи на каждый зум
     * @param {Object} options - опции, необходимые для подписи
     * @param {Object} zoomRangeOptions - опции для нескольких зумов, необходимые для подписи
     */
    setLabelData(options, zoomRangeOptions) {
        this._data = new LabelData(this._polygon, options, zoomRangeOptions, this._map, this);
        return this._data;
    }

    getLabelData() {
        return this._data;
    }

    getPlacemark(type) {
        return this._placemark[type];
    }

    getLayout(type) {
        return this._layout[type];
    }

    removeFromCollection() {
        if (!this._parentCollection) {
            return;
        }
        ['label', 'dot'].forEach(type => {
            if (this._parentCollection.indexOf(this._placemark[type]) === -1) {
                return;
            }
            this._parentCollection.remove(this._placemark[type]);
        });
        this._polygon = null;
        this._parentCollection = null;
        this._placemark = null;
        this._layout = null;
        this._data = null;
    }

    addToCollection() {
        if (!this._parentCollection) {
            return Promise.reject();
        }
        const layouts = ['label', 'dot'].map(type => {
            if (!this._placemark[type].getParent()) {
                this._parentCollection.add(this._placemark[type]);
            }
            return this.getLabelLayout(type).then(layout => {
                this._layout[type] = layout;
            });
        });
        return Promise.all(layouts);
    }

    /**
     * Возвращает layout для подписи
     * @param {string} type - тип подписи (label | dot), у которой необходимо получить layout
     */
    getLabelLayout(type) {
        return this._placemark[type].getOverlay()
            .then(overlay => overlay.getLayout());
    }

    _init() {
        const layout = getLayoutTemplate(this._polygon.options.getAll(), this._layoutTemplateCache);
        ['label', 'dot'].forEach(key => {
            this._placemark[key] = Label._createPlacemark({
                properties: Object.assign({}, {
                    labelPolygon: this._polygon
                }, this._polygon.properties.getAll()),
                options: this._polygon.options.getAll()
            }, layout[key]);
        });
    }

    static _createPlacemark(params, layout) {
        const options = Object.assign({}, {
            iconLayout: layout,
            pointOverlay: LabelPlacemarkOverlay,
            iconLabelPosition: 'absolute'
        }, params.options);
        return new Placemark([0, 0], params.properties, options);
    }

    /**
     * Устанавливает необходимые свойства подписи для текущего зума
     * @return {Object}
     * visible - рассчитанный тип, который виден
     * visibleForce - рассчитанный тип, который виден принудительно
     * visibleType - текущий тип, который виден
     */
    setDataByZoom(zoom, visibleState) {
        const allData = this._data.getAll();
        this.setStyles(allData.zoomInfo[zoom].style);
        this._data.setZoomData(zoom);

        let {zoomInfo, autoCenter, dotVisible, dotSize} = allData;
        zoomInfo = zoomInfo[zoom];
        this.setCoordinates(zoomInfo.center || autoCenter);
        visibleState = visibleState ? visibleState : zoomInfo.visibleForce;
        let visibleType = visibleState === 'auto' ? zoomInfo.visible : visibleState;
        if (visibleType === 'dot' && !dotVisible) {
            visibleType = 'none';
        }
        this.setVisibility(visibleType);
        if (['dot', 'label'].indexOf(visibleType) !== -1) {
            this.setCenterAndIconShape(
                visibleType,
                visibleType === 'dot' ? dotSize : zoomInfo.labelSize,
                zoomInfo.labelOffset
            );
        }
        return {
            visible: zoomInfo.visible,
            visibleForce: zoomInfo.visibleForce,
            visibleType
        };
    }

    /**
     * Устанавливает template для подписи
     */
    setLayoutTemplate() {
        const layout = getLayoutTemplate(this._polygon.options.getAll(), this._layoutTemplateCache);
        Object.keys(layout).forEach((type) => {
            let iconLayout = layout[type];
            if (this._placemark[type].getParent()) {
                this._placemark[type].options.set({iconLayout});
            }
        });
    }

    /**
     * Устанавливает координаты для подписи
     */
    setCoordinates(coords) {
        if (coords.toString() !== this._placemark.label.geometry.getCoordinates().toString()) {
            ['dot', 'label'].forEach(type => {
                this._placemark[type].geometry.setCoordinates(coords);
            });
        }
    }

    /**
     * Устанавливает видимость для подписи
     */
    setVisibility(visibleType) {
        Object.keys(this._placemark).forEach(type => {
            const pane = type === visibleType ? 'places' : 'phantom';
            this._placemark[type].options.set({pane});
        });
    }

    /**
     * Устанавливает стили для подписи
     */
    setStyles(data) {
        this._placemark.label.options.set({
            iconLabelClassName: data.className,
            iconLabelTextSize: data.textSize,
            iconLabelTextColor: data.textColor
        });
    }

    /**
     * Центрирует подпись и создает ей правильный iconShape
     */
    setCenterAndIconShape(type, size, offset) {
        const h = size.height / 2;
        const w = size.width / 2;

        this._placemark[type].options.set({
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

    destroy() {
        this.removeFromCollection();
    }
}
