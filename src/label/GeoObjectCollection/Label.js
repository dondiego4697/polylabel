import Placemark from 'Placemark';
import LabelPlacemarkOverlay from 'src.label.util.LabelPlacemarkOverlay';
import createLabelLayoutTemplate from 'src.label.util.createLabelLayoutTemplate';
import createDotLayoutTemplate from 'src.label.util.createDotLayoutTemplate';
import getLabelLayout from 'src.label.util.getLabelLayout';

/**
 * Class representing a label
 * @param {GeoObject} polygon
 * @param {Object} options
 * @param {Object} properties
 * @param {GeoObjectCollection} parentCollection
 */

export default class Label {
    constructor(polygon, options, properties, parentCollection, layoutTemplateCache) {
        if (!polygon || !parentCollection) {
            throw new Error('wrong argument');
        }
        this._polygon = polygon;
        this._parentCollection = parentCollection;
        this._placemark = {
            label: null,
            dot: null
        }
        this._layout = {
            label: null,
            dot: null
        };
        this._init(options, properties, layoutTemplateCache);
    }

    getPlacemark() {
        return this._placemark;
    }

    getLayout() {
        return this._layout;
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
    }

    addToCollection() {
        if (!this._parentCollection) {
            return Promise.reject();
        }
        const layouts = ['label', 'dot'].map(type => {
            if (!this._placemark[type].getParent()) {
                this._parentCollection.add(this._placemark[type]);
            }
            return getLabelLayout(this._placemark[type]).then(layout => {
                this._layout[type] = layout;
            });
        });
        return Promise.all(layouts);
    }

    _init(options, properties, layoutTemplateCache) {
        const { labelLayout, labelDotLayout } = this._getLayoutTemplate(options, layoutTemplateCache);
        this._placemark.label = Label._createPlacemark({
            properties: {
                '_labelPolygon': this._polygon
            },
            options
        }, labelLayout);

        this._placemark.dot = Label._createPlacemark({
            properties: {
                '_labelPolygon': this._polygon
            }
        }, labelDotLayout);
    }

    _getLayoutTemplate(options, layoutTemplateCache) {
        let createTemplate = {
            labelLayout: createLabelLayoutTemplate,
            labelDotLayout: createDotLayoutTemplate
        };
        return ['labelLayout', 'labelDotLayout'].reduce((result, key) => {
            let layoutTemplate = options[key];
            let layoutTemplateKey = !layoutTemplate ? `default${key}` : layoutTemplate;

            if (layoutTemplateCache[layoutTemplateKey]) {
                result[key] = layoutTemplateCache[layoutTemplateKey];
            } else {
                const template = createTemplate[key](layoutTemplate);
                result[key] = template;
                layoutTemplateCache[layoutTemplateKey] = template;
            }
            return result;
        }, {});
    }

    static _createPlacemark(params, layout) {
        const options = Object.assign({}, {
            iconLayout: layout,
            iconLabelPosition: 'absolute',
            pointOverlay: LabelPlacemarkOverlay
        }, params.options);
        return new Placemark([0, 0], params.properties, options);
    }

    setLayoutTemplate(params) {
        const createLayoutTemplate = {
            label: createLabelLayoutTemplate,
            dot: createDotLayoutTemplate
        };

        return Promise.all(Object.keys(params).map((type) => {
            let iconLayout = createLayoutTemplate[type](params[type]);
            if (this._placemark[type].getParent()) {
                this._placemark[type].options.set({ iconLayout });
            }
            /* return getLabelLayout(this._placemark[type]).then(layout => {
                this._layout[type] = layout;
            }); */
        }));
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

    setSize(type, size) {
        const h = size.height / 2;
        const w = size.width / 2;

        this._placemark[type].options.set({
            iconShape: {
                type: 'Rectangle',
                coordinates: [
                    [-w, -h],
                    [w, h]
                ]
            },
            iconLabelTop: -h,
            iconLabelLeft: -w
        });
    }

    destroy() {
        this.removeFromCollection();
    }
}
