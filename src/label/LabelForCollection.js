import Placemark from 'Placemark';
import XPlacemark from 'XPlacemark';
import createLabelLayoutTemplate from 'createLabelLayoutTemplate';
import createDotLayoutTemplate from 'createDotLayoutTemplate';
import getLabelLayout from 'getLabelLayout';

/**
 * Class representing a label
 * @param {GeoObject} polygon
 * @param {Object} options
 * @param {Object} properties
 * @param {GeoObjectCollection} parentCollection
 */

export default class LabelForCollection {
    constructor(polygon, options, properties, parentCollection) {
        if (!polygon || !parentCollection) {
            throw new Error('wrong argument');
        }
        this._polygon = polygon;
        this._parentCollection = parentCollection;
        this._options = Object.assign({}, options);
        this._properties = Object.assign({}, properties);
        this._placemark = {
            label: null,
            dot: null
        }
        this._layout = {
            label: null,
            dot: null
        };
        this._size = {
            label: {
                w: 0,
                h: 0
            },
            dot: {
                w: 0,
                h: 0
            }
        };
        this._init();
    }

    getPlacemark() {
        return this._placemark;
    }

    getLayout() {
        return this._layout;
    }

    _saveSize(type, size) {
        this._size[type] = {
            w: size.width,
            h: size.height
        }
    }

    removeFromCollection(types) {
        types.forEach(type => {
            if (!this._parentCollection ||
                this._parentCollection.indexOf(this._placemark[type]) === -1) {
                return;
            }
            this._parentCollection.remove(this._placemark[type]);
        });
    }

    addToCollection(types) {
        return new Promise((resolve, reject) => {
            if (!this._parentCollection) {
                reject();
                return;
            }
            let promises = [];
            types.forEach(type => {
                this._parentCollection.add(this._placemark[type]);
                promises.push(new Promise(resolve => {
                    getLabelLayout(this._placemark[type]).then(layout => {
                        this._layout[type] = layout;
                        resolve();
                    });
                }));
            });

            Promise.all(promises).then(() => {
                resolve();
            });
        });
    }

    _init() {
        let { labelLayout, labelDotLayout } = this._options;
        labelLayout = createLabelLayoutTemplate(labelLayout);
        labelDotLayout = createDotLayoutTemplate(labelDotLayout);

        this._placemark.label = LabelForCollection._createPlacemark({
            properties: Object.assign(this._properties, {
                '_labelPolygon': this._polygon
            }),
            options: this._options
        }, labelLayout);

        this._placemark.dot = LabelForCollection._createPlacemark({
            properties: Object.assign(this._properties, {
                '_labelPolygon': this._polygon
            })
        }, labelDotLayout);
    }

    static _createPlacemark(params, layout) {
        let { properties, options } = params;
        options = Object.assign({}, {
            iconLayout: layout,
            iconLabelPosition: 'absolute',
            pointOverlay: XPlacemark
        }, options);
        return new Placemark(
            [0, 0],
            properties,
            options);
    }

    _setLayoutTemplate(types, templates) {
        const createLayoutTemplate = {
            label: createLabelLayoutTemplate,
            dot: createDotLayoutTemplate
        };

        return Promise.all(types.map((type, i) => {
            let iconLayout = createLayoutTemplate[type](templates[i]);
            this._placemark[type].options.set({ iconLayout });
            /* return getLabelLayout(this._placemark[type]).then(layout => {
                this._layout[type] = layout;
            }); */
        }));
    }

    _setCoordinates(coords) {
        if (coords !== this._placemark.label.geometry.getCoordinates()) {
            ['dot', 'label'].forEach(type => {
                this._placemark[type].geometry.setCoordinates(coords);
            });
        }
    }

    _setVisibility(visibleType) {
        Object.keys(this._placemark).forEach(type => {
            const pane = type === visibleType ? 'places' : 'phantom';
            this._placemark[type].options.set({ pane });
        });
    }

    _setStyles(data) {
        const { className, textColor, textSize } = data;
        this._options.labelTextSize = textSize;
        this._options.labelTextColor = textColor;
        this._options.labelTextClassName = className;
        this._placemark.label.options.set(this._getLabelStyleOption('label'));
    }

    _setSize(type, size) {
        const h = size.height / 2;
        const w = size.width / 2;
        this._saveSize(type, size);
        this._placemark[type].options.set(Object.assign({}, {
            iconShape: {
                type: 'Rectangle',
                coordinates: [
                    [-w, -h],
                    [w, h]
                ]
            }
        }, this._getLabelStyleOption(type)));
    }

    _getLabelStyleOption(type) {
        let { labelTextClassName, labelTextColor, labelTextSize } = this._options;
        let { w, h } = this._size[type];
        return {
            iconLabelClassName: this._isObject(labelTextClassName) ? '' : labelTextClassName,
            iconLabelTextSize: this._isObject(labelTextSize) ? '' : labelTextSize,
            iconLabelTextColor: this._isObject(labelTextColor) ? '' : labelTextColor,
            iconLabelTop: -(h / 2),
            iconLabelLeft: -(w / 2)
        }
    }

    _isObject(val) {
        return Object.prototype.toString.call(val) === '[object Object]';
    }

    destroy() {
        this.removeFromCollection(['dot', 'label']);
    }
}
