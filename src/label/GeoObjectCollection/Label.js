import Placemark from 'Placemark';
import LabelPlacemarkOverlay from 'src.label.util.LabelPlacemarkOverlay';
import LabelData from 'src.label.util.LabelData';
import getBaseLayoutTemplates from 'src.label.util.layoutTemplates.getBaseLayoutTemplates';
import createLayoutTemplates from 'src.label.util.layoutTemplates.createLayoutTemplates';

/**
 * Класс подписи полигона для геоколлекции
 */
export default class Label {
    constructor(map, polygon, parentCollection) {
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
        this._baseLayoutTemplates = null;
        this._layoutTemplates = null;
        this._init();
    }

    getPlacemark(type) {
        return this._placemark[type];
    }

    getLayout(type) {
        return this._layout[type];
    }

    setLayout(type, layout) {
        this._layout[type] = layout;
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
        this._baseLayoutTemplates = getBaseLayoutTemplates();
        this._layoutTemplates = createLayoutTemplates(
            this._polygon.options.get('labelLayout'),
            this._polygon.options.get('labelDotLayout')
        );
    }

    createPlacemarks() {
        ['label', 'dot'].forEach(type => {
            this._placemark[type] = Label._createPlacemark({
                properties: Object.assign({}, {
                    polygon: this._polygon
                }, this._polygon.properties.getAll()),
                options: Object.assign({}, this._polygon.options.getAll(), this._layoutTemplates[type])
            }, this._baseLayoutTemplates[type]);
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

    createLabelData(options, zoomRangeOptions) {
        this._data = new LabelData(this._polygon, options, zoomRangeOptions, this._map, this);
        return this._data;
    }

    getLabelData() {
        return this._data;
    }

    setDataByZoom(zoom, visibleState) {
        ['dot', 'label'].forEach(type => {
            if (type === 'label') {
                const styles = this._data.getStyles(zoom);
                this.setStyles({
                    className: styles.className,
                    textSize: styles.textSize,
                    textColor: styles.textColor
                });
            }
            this._data.setVisible(zoom, type, this._layout[type]);
        });

        const currentVisibleType = this.setVisibility(
            visibleState,
            this._data.getVisibility(zoom),
            this._data.getData('dotVisible')
        );

        if (['label', 'dot'].indexOf(currentVisibleType) !== -1 &&
            this._data.getSize(zoom, currentVisibleType)) {
            this.setCoordinates(this._data.getCenterCoords(zoom));
            this.setCenterAndIconShape(
                currentVisibleType,
                this._data.getSize(zoom, currentVisibleType),
                this._data.getOffset(zoom)
            );
        }

        return {
            currentVisibleType,
            currentConfiguredVisibileType: this._data.getVisibility(zoom)
        }
    }

    setLayoutTemplate() {
        this._layoutTemplates = createLayoutTemplates(
            this._polygon.options.get('labelLayout'),
            this._polygon.options.get('labelDotLayout')
        );
        
        Object.keys(this._layoutTemplates).forEach(type => {
            this._placemark[type].options.set(this._layoutTemplates[type]);
        });
    }

    setNewOptions(newOptions) {
        ['dot', 'label'].forEach(type => {
            this._placemark[type].options.set(newOptions);
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

    setVisibilityForce(visibleType) {
        Object.keys(this._placemark).forEach(type => {
            const pane = type === visibleType ? 'places' : 'phantom';
            if (this._placemark[type].options.get('pane') !== pane) {
                this._placemark[type].options.set({pane});
            }
        });
    }

    /**
     * Устанавливает видимость для подписи
     */
    setVisibility(visibleState, visible, dotVisible) {
        let currState = visibleState && visibleState !== 'auto' ? visibleState : visible;
        if (currState === 'dot' && !dotVisible) {
            currState = 'none';
        }

        this.setVisibilityForce(currState);
        return currState;
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
                    [-w + offset[0], -h + offset[1]],
                    [w + offset[0], h + offset[1]]
                ]
            },
            iconLabelLeft: -w + offset[0],
            iconLabelTop: -h + offset[1]
        });
    }

    destroy() {
        this.removeFromCollection();
    }
}
