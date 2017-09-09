import Label from 'Label';
import setCenter from 'setCenter';
import createDefaultLabelData from 'createDefaultLabelData';
import setZoomVisibility from 'setZoomVisibility';
import setPresets from 'setPresets';
import CONFIG from 'config';
import createLabelLayout from 'createLabelLayout';

class Polylabel {
    /**
     * @param {Map} map - карта.
     * @param {GeoObjectCollection} collections - коллекция коллекций геообъектов.
     */
    constructor(map, collections) {
        this._map = map;
        this._collections = collections;
        this._labelsCollections = new ymaps.GeoObjectCollection();
        this._map.geoObjects.add(this._labelsCollections);
        this._labelLayout = createLabelLayout();
        this._initData();
    }

    update() {
        this._calculateCollections(true);
    }

    destroy() {
        this._labelsCollections.removeAll();
        this._deleteListeners();
    }

    _initData() {
        setPresets(this._collections);
        this._calculateCollections(true).then(() => {
            this._initMapListeners();
            this._initCollectionListeners();
        });
    }

    _calculateCollections(isFirstCals) {
        return new Promise(resolve => {
            if (isFirstCals) {
                this._clearLabelCollections();
            }
            this._collections.each((collection) => {
                let labelCollection;
                if (isFirstCals) {
                    labelCollection = new ymaps.GeoObjectCollection();
                    this._labelsCollections.add(labelCollection);
                }
                collection.each((geoObject) => {
                    if (isFirstCals) {
                        this._calculateGeoObject(geoObject, labelCollection).then(() => {
                            this._analyseLabelData(geoObject);
                        });
                    } else {
                        this._analyseLabelData(geoObject);
                    }
                });
                resolve();
            });
        });
    }

    _analyseLabelData(geoObject) {
        let { data: labelData, autoCenter, label } = geoObject.properties.get('labelData');
        labelData = labelData[this._map.getZoom()];

        if (labelData.visibleForce || labelData.visible) {
            label.geometry.setCoordinates(labelData.center || autoCenter);
            label.options.set({
                pane: 'places'
            });
        } else {
            label.options.set({
                pane: 'phantom'
            });
        }
    }

    _calculateGeoObject(geoObject, labelCollection) {
        const options = this._getOptions(geoObject);
        const properties = this._getProperties(geoObject);
        let labelData = createDefaultLabelData();
        setCenter(labelData, geoObject, properties);
        const labelInst = new Label(geoObject, options, this._labelLayout);
        labelCollection.add(labelInst.get());

        return new Promise(resolve => {
            labelInst.get().getOverlay().then(overlay => overlay.getLayout()).then(layout => {
                const size = layout._element.firstChild.getBoundingClientRect();
                labelCollection.remove(labelInst.get());
                labelInst.culcLabelSize(size);
                labelCollection.add(labelInst.get());
                labelInst.initEvents();
                setZoomVisibility(this._map, labelData, geoObject, size, options.labelForceVisibleZoom);
                labelData.label = labelInst.get();
                geoObject.properties.set('labelData', labelData);
                resolve();
            });
        });
    }

    _getOptions(obj) {
        const mainOpts = CONFIG.options;
        const options = obj.options;
        const result = {};
        mainOpts.forEach((key) => {
            result[key] = options.get(key, 'default');
        });
        return result;
    }

    _getProperties(obj) {
        const mainProperties = CONFIG.properties;
        const properties = obj.properties;
        const result = {};
        mainProperties.forEach((key) => {
            result[key] = properties.get(key, 'default');
        });
        return result;
    }

    _clearLabelCollections() {
        this._labelsCollections.removeAll();
        this._labelsCollections.options.set({
            pane: 'phantom'
        });
    }

    _initMapListeners() {
        this._map.events.add('boundschange', this.__mapBoundsChange, this);
    }

    _initCollectionListeners() {
        this._collections.events.add(['add', 'remove'], this.__collectionEvents, this);
    }

    __mapBoundsChange(event) {
        if (event.get('newZoom') !== event.get('oldZoom')) {
            this._calculateCollections();
        }
    }

    __collectionEvents(event) {
        switch (event.get('type')) {
            case 'add': { }
            case 'remove': {
                this._calculateCollections(true);
                break;
            }
        }
    }

    _deleteListeners() {
        this._collections.events.remove(['add', 'remove'], this.__collectionEvents, this);
        this._map.events.remove('boundschange', this.__mapBoundsChange, this);
    }
}

export default Polylabel;
