import LabelPlacemarkOverlay from 'src.label.util.LabelPlacemarkOverlay';
import LabelData from 'src.label.util.LabelData';
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
        this._baseLayoutTemplates = null;
        this._layoutTemplates = null;
        this._init();
    }

    destroy() {
        this.removeFromObjectManager();
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

    removeFromObjectManager() {
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
        this._baseLayoutTemplates = getBaseLayoutTemplates();
        this._layoutTemplates = createLayoutTemplates(
            this._polygon.options.labelLayout,
            this._polygon.options.labelDotLayout
        );
    }

    createPlacemarks() {
        ['label', 'dot'].forEach(type => {
            this._placemark[type] = Label._createPlacemark(`${type}#${this._polygon.id}`, {
                properties: Object.assign({}, {
                    polygon: this._polygon
                }, this._polygon.properties),
                options: Object.assign({}, this._polygon.options, this._layoutTemplates[type])
            }, this._baseLayoutTemplates[type], this._data.getCenterCoords(this._map.getZoom()));
        });
    }

    static _createPlacemark(id, params, layout, coordinates) {
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
                coordinates
            }
        };
    }

    _updateOptions(id, options) {
        this._objectManager.objects.setObjectOptions(id, options);
    }

    createLabelData(options, zoomRangeOptions) {
        this._data = new LabelData(this._polygon, options, zoomRangeOptions, this._map, this);
        return this._data;
    }

    getLabelData() {
        return this._data;
    }

    setLayout(type, layout) {
        this._layout[type] = layout;
    }

    setLayoutTemplate() {
        this._layoutTemplates = createLayoutTemplates(
            this._polygon.options.labelLayout,
            this._polygon.options.labelDotLayout
        );
        
        Object.keys(this._layoutTemplates).forEach(type => {
            this._updateOptions(this._placemark[type].id, this._layoutTemplates[type]);
        });
    }

    setNewOptions(newOptions) {
        ['dot', 'label'].forEach((type) => {
            Object.assign(this._placemark[type].options, newOptions);      
            this._updateOptions(
                this._placemark[type].id,
                this._placemark[type].options
            );
        });
    }

    setDataByZoom(zoom, types, visibleState) {
        types.forEach(type => {
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

    setCoordinates(coords) {
        if (coords.toString() !== this._placemark.label.geometry.coordinates.toString()) {
            ['dot', 'label'].forEach(type => {
                this._objectManager.remove(this._placemark[type]);
                this._generateNewPlacemark(type);
                this._placemark[type].geometry.coordinates = coords;
                this._objectManager.add(this._placemark[type]);
            });
        }
    }

    setStyles(data) {
        this._updateOptions(this._placemark.label.id, {
            iconLabelClassName: data.className,
            iconLabelTextSize: data.textSize,
            iconLabelTextColor: data.textColor
        });
    }

    setVisibilityForce(visibleType) {
        Object.keys(this._placemark).forEach(type => {
            const pane = type === visibleType ? 'places' : 'phantom';
            const label = this._objectManager.objects.getById(this._placemark[type].id);
            if (label && label.options.pane !== pane) {
                this._updateOptions(this._placemark[type].id, {pane});
            }
        });
    }

    setVisibility(visibleState, visible, dotVisible) {
        let currState = visibleState && visibleState !== 'auto' ? visibleState : visible;
        if (currState === 'dot' && !dotVisible) {
            currState = 'none';
        }

        this.setVisibilityForce(currState);
        return currState;
    }

    _generateNewPlacemark(type) {
        this._placemark[type] = Object.assign({}, this._placemark[type]);
        const id = this._placemark[type].id;
        this._placemark[type].id = id[0] === '_' ? id.slice(1) : `_${id}`;
    }
}
