import Placemark from 'Placemark';
import XPlacemark from 'XPlacemark';
import createLabelLayoutTemplate from 'createLabelLayoutTemplate';
import getLabelLayout from 'getLabelLayout';

/**
 * Class representing a label
 * @param {GeoObject} geoObject
 */
export default class LabelForCollection {
    constructor(geoObject, options, properties, parentCollection) {
        if (!geoObject || !parentCollection) {
            throw new Error('wrong argument');
        }
        this._geoObject = geoObject;
        this._parentCollection = parentCollection;
        this._options = Object.assign({}, options);
        this._properties = Object.assign({}, properties);
        this._label = null;
        this._dot = null;
        this._layout = null;
        this._size = {
            width: 0,
            height: 0
        };
        this._initLabel();
    }

    /**
     * @return {Placemark} The instance of Placemark.
     */
    getPlacemark() {
        return this._label;
    }

    getLayout() {
        return this._layout;
    }

    _saveSize(size) {
        this._size.width = size.width;
        this._size.height = size.height;
    }

    /**
     * Remove placemark from collection
     */
    removeFromCollection() {
        if (!this._parentCollection || this._parentCollection.indexOf(this._label) === -1) {
            return false;
        }
        this._parentCollection.remove(this._label);
    }

    /**
     * Add placemark to collection
     */
    addToCollection() {
        return new Promise((resolve, reject) => {
            if (!this._parentCollection) {
                reject();
                return;
            }
            this._parentCollection.add(this._label);

            getLabelLayout(this._label).then(layout => {
                this._layout = layout;
                resolve();
            });
        });
    }

    /**
     * Create & init placemark by template
     */
    _initLabel() {
        let { labelLayout } = this._options;
        labelLayout = createLabelLayoutTemplate(labelLayout);

        this._label = LabelForCollection._createPlacemark({
            properties: Object.assign(this._properties, {
                'labelPolygon': this._geoObject
            }),
            options: this._options
        }, labelLayout);
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

    _setLayout(layout) {
        return new Promise(resolve => {
            let iconLayout = createLabelLayoutTemplate(layout);
            this._label.options.set({ iconLayout });
            getLabelLayout(this._label).then(layout => {
                this._layout = layout;
                resolve();
            });
        });
    }

    _setCoordinates(coords) {
        if (coords !== this._label.geometry.getCoordinates()) {
            this._label.geometry.setCoordinates(coords);
        }
    }

    _setVisibility(isVisible) {
        const pane = isVisible ? 'places' : 'phantom';
        if (this._label.options.get('pane') !== pane) {
            this._label.options.set({ pane });
        }
    }

    _setStyles(data) {
        const { className, textColor, textSize } = data;
         this._options.labelTextSize = textSize;
        this._options.labelTextColor = textColor;
        this._options.labelTextClassName = className;
        if (data.size) {
            this._size.height = data.size.height || this._size.height;
            this._size.width = data.size.width || this._size.width;
        }
        this._label.options.set(this._getLabelStyleOption());
    }

    _setSize(size) {
        const h = size.height / 2;
        const w = size.width / 2;
        this._saveSize(size);
        this._label.options.set({
            iconLabelTop: -h,
            iconLabelLeft: -w,
            iconShape: {
                type: 'Rectangle',
                coordinates: [
                    [-w, -h],
                    [w, h]
                ]
            }
        });
    }

    _getLabelStyleOption() {
        let { labelTextClassName, labelTextColor, labelTextSize } = this._options;
        let { width: w, height: h } = this._size;
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
        this.removeFromCollection();
        this._label = undefined;
    }
}
