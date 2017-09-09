export default class Label {
    constructor(geoObject, options, LayoutClass) {
        this._geoObject = geoObject;
        this._options = options;
        this._label = null;
        this._LayoutClass = LayoutClass;
        this._initLabel();
    }

    get() {
        return this._label;
    }

    initEvents() {
        this._label.events.add('click', this.__labelClick, this);
    }

    culcLabelSize(size) {
        const h = size.height / 2;
        const w = size.width / 2;
        this._label = this._createLabel({
            properties: Object.assign({}, this._label.properties.getAll(), {
                top: -h,
                left: -w
            }),
            options: {
                iconShape: {
                    type: 'Rectangle',
                    coordinates: [[-w, -h], [w, h]]
                }
            }
        });
    }

    _initLabel() {
        const { labelHtml } = this._options;
        let result;
        if (labelHtml !== 'default') {
            result = labelHtml;
        } else {
            result = this._createLabelWithPresets();
        }
        this._label = this._createLabel({
            properties: {
                html: result.outerHTML
            }
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

        let label = document.createElement('div');
        label.style.fontSize = labelTextSize;
        label.style.color = textColor;
        label.style.textShadow = `
            1px 1px 0 ${outlineColor},
            -1px -1px 0 ${outlineColor},
            1px -1px 0 ${outlineColor},
            -1px 1px 0 ${outlineColor}`;
        label.innerHTML = labelText !== 'default' ? labelText : null;
        if (labelTextClassName !== 'default') {
            label.className = labelTextClassName;
        }
        return label;
    }

    __labelClick(event) {
        this._geoObject.events.fire('labelClick', {
            targetLabel: event.get('target')
        });
    }

    _removeClickEvent() {
        this._label.events.remove('click', this.__labelClick, this);
    }
}
