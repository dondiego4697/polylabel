import stringReplacer from 'stringReplacer';

/** Class representing a label */
export default class Label {
    /**
     * Create a Label
     * @param {GeoObject} geoObject
     * @param {Object} options
     * @param {templateLayoutFactory} LayoutClass
     * @param {GeoObjectCollection} parentCollection
     */
    constructor(geoObject, options, LayoutClass, parentCollection) {
        if (!geoObject || !LayoutClass || !parentCollection) {
            throw new Error('wrong argument');
        }
        this._geoObject = geoObject;
        this._parentCollection = parentCollection;
        this._options = options;
        this._label = null;
        this._LayoutClass = LayoutClass;
        this._initLabel();
    }

    /**
     * @return {Placemark} The instance of Placemark.
     */
    getPlacemark() {
        return this._label;
    }

    /**
     * Create Placemark with size.
     * @param {Object} size
     */
    calculateLabelSize(size) {
        this.removeFromCollection();
        const h = size.height / 2;
        const w = size.width / 2;
        this._label = Label._createPlacemark({
            properties: Object.assign({}, this._label.properties.getAll(), {
                top: -h,
                left: -w
            }),
            options: Object.assign({}, this._label.options.getAll(), {
                iconShape: {
                    type: 'Rectangle',
                    coordinates: [[-w, -h], [w, h]]
                }
            })
        }, this._LayoutClass);
        this.addToCollection();
    }

    /**
     * Remove placemark from collection
     */
    removeFromCollection() {
        if (!this._parentCollection) {
            return false;
        }
        this._parentCollection.remove(this._label);
    }
    /**
     * Add placemark to collection
     */
    addToCollection() {
        if (!this._parentCollection) {
            return false;
        }
        this._parentCollection.add(this._label);
    }

    /**
     * Create & init placemark by template
     */
    _initLabel() {
        const {labelHtml} = this._options;
        let result;
        if (labelHtml) {
            result = labelHtml;
        } else {
            result = this._createLabelContentWithPresets();
        }
        this._label = Label._createPlacemark({
            properties: {
                html: result
            },
            options: this._options
        }, this._LayoutClass);
    }

    /**
     * Create Placemark.
     * @param {Object} params
     * @return {Placemark}
     */
    static _createPlacemark(params, LayoutClass) {
        let {properties, options} = params;
        properties = Object.assign({}, {
            top: 0,
            left: 0,
            position: 'absolute'
        }, properties);
        options = Object.assign({}, {
            iconLayout: LayoutClass
        }, options);
        return new ymaps.Placemark(
            [0, 0],
            properties,
            options);
    }

    /**
     * Create label content for Placemark.
     * return {String} content.
     */
    _createLabelContentWithPresets() {
        const {
            labelText, labelTextClassName, labelTextSize, outlineColor, textColor
        } = this._options;
        const textShadow = `
        1px 1px 0 ${outlineColor},
        -1px -1px 0 ${outlineColor},
        1px -1px 0 ${outlineColor},
        -1px 1px 0 ${outlineColor}`;
        const template = '<div class="$1" style="font-size: $2; color: $3; text-shadow: $4">$5</div>';
        return stringReplacer(template, [labelTextClassName, labelTextSize, textColor, textShadow, labelText]);
    }

    _initEvents() {
        this._label.events.add('click', this._labelClick, this);
    }

    _labelClick() {
        this._geoObject.events.fire('labelClick', {
            targetLabel: this._label
        });
    }

    _removeClickEvent() {
        this._label.events.remove('click', this._labelClick, this);
    }

    destroy() {
        this._removeClickEvent();
        this.removeFromCollection();
        this._label = null;
    }
}
