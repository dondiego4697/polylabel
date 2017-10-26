import Placemark from 'Placemark';
import LabelPlacemarkOverlay from 'src.label.util.LabelPlacemarkOverlay';
import createLabelLayoutTemplate from 'src.label.util.createLabelLayoutTemplate';
import createDotLayoutTemplate from 'src.label.util.createDotLayoutTemplate';
import LabelData from 'src.label.LabelData';
import getLayoutTemplate from 'src.label.util.getLayoutTemplate';

/**
 * Класс подписи полигона для геоколлекции
 */
export default class Label {
    constructor(polygon, parentCollection, layoutTemplateCache) {
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

    setLabelData(options, zoomRangeOptions) {
        this._data = new LabelData(this._polygon, options, zoomRangeOptions);
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

    getLabelLayout(type) {
        return this._placemark[type].getOverlay()
            .then(overlay => overlay.getLayout());
    }

    _init() {
        const { labelLayout, labelDotLayout } = getLayoutTemplate(this._polygon.options, this._layoutTemplateCache);
        const layout = {
            label: labelLayout,
            dot: labelDotLayout
        };
        ['label', 'dot'].forEach(key => {
            this._placemark[key] = Label._createPlacemark({
                properties: Object.assign({}, {
                    'labelPolygon': this._polygon
                }, this._polygon.properties),
                options: this._polygon.options.getAll()
            }, layout[key]);
        });
    }

    static _createPlacemark(params, layout) {
        const options = Object.assign({}, {
            iconLayout: layout,
            iconLabelPosition: 'absolute',
            pointOverlay: LabelPlacemarkOverlay
        }, params.options);
        return new Placemark([0, 0], params.properties, options);
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
            this.setCenterAndIconShape(visibleType, visibleType === 'dot' ? dotSize : zoomInfo.labelSize, zoomInfo.labelOffset);
        }
        this.setStyles(zoomInfo.style);
        return {
            visible: zoomInfo.visible,
            visibleForce: zoomInfo.visibleForce,
            visibleType
        }
    }

    setLayoutTemplate(params) {
        const createLayoutTemplate = {
            label: createLabelLayoutTemplate,
            dot: createDotLayoutTemplate
        };
        Object.keys(params).forEach((type) => {
            let iconLayout = createLayoutTemplate[type](params[type]);
            if (this._placemark[type].getParent()) {
                this._placemark[type].options.set({ iconLayout });
            }
        });
    }

    setCoordinates(coords) {
        if (coords.toString() !== this._placemark.label.geometry.getCoordinates().toString()) {
            ['dot', 'label'].forEach(type => {
                this._placemark[type].geometry.setCoordinates(coords);
            });
        }
    }

    setVisibility(visibleType) {
        Object.keys(this._placemark).forEach(type => {
            const pane = type === visibleType ? 'places' : 'phantom';
            this._placemark[type].options.set({ pane });
        });
    }

    setStyles(data) {
        this._placemark.label.options.set({
            iconLabelClassName: data.className,
            iconLabelTextSize: data.textSize,
            iconLabelTextColor: data.textColor
        });
    }

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
