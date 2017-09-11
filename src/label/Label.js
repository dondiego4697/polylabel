import stringReplacer from 'stringReplacer';
export default class Label {
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

    getPlacemark() {
        return this._label;
    }

    culculateLabelSize(size) {
        this.removeFromCollection();
        const h = size.height / 2;
        const w = size.width / 2;
        this._label = this._createLabel({
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
        });
        this.addToCollection();
    }

    removeFromCollection() {
        if (!this._parentCollection) {
            return false;
        }
        this._parentCollection.remove(this._label);
    }

    addToCollection() {
        if (!this._parentCollection) {
            return false;
        }
        this._parentCollection.add(this._label);
    }

    _initLabel() {
        const { labelHtml } = this._options;
        let result;
        if (labelHtml) {
            result = labelHtml;
        } else {
            result = this._createLabelWithPresets();
        }
        this._label = this._createLabel({
            properties: {
                html: result
            },
            options: this._options
        });
    }

    _createLabel(params) {
        let { properties, options } = params;
        properties = Object.assign({}, {
            top: 0,
            left: 0,
            position: 'absolute'
        }, properties);
        options = Object.assign({}, {
            iconLayout: this._LayoutClass
        }, options);
        return new ymaps.Placemark(
            [0, 0],
            properties,
            options);
    }

    _createLabelWithPresets() {
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
            targetLabel: this
        });
    }

    _removeClickEvent() {
        this._label.events.remove('click', this._labelClick, this);
    }
}
