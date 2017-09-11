import Label from 'Label';
import setCenter from 'setCenter';
import createDefaultLabelData from 'createDefaultLabelData';
import setZoomVisibility from 'setZoomVisibility';
import setPresets from 'setPresets';
import CONFIG from 'config';
import createLabelLayout from 'createLabelLayout';
import GeoObjectCollection from 'GeoObjectCollection';

class Polylabel {
    /**
     * @param {Map} map - карта.
     * @param {GeoObjectCollection} collections - коллекция коллекций геообъектов.
     */
    constructor(map, collections) {
        this._map = map;
        this._collections = collections;
        this._labelsCollections = new GeoObjectCollection();
        this._map.geoObjects.add(this._labelsCollections);
        this._labelLayout = createLabelLayout;
        this._initData();
    }

    update() {
        this._culculateCollections(true);
    }

    destroy() {
        this._labelsCollections.removeAll();
        this._deleteListeners();
    }

    _initData() {
        setPresets(this._collections);
        this._culculateCollections(true).then(() => {
            this._initMapListeners();
            this._initCollectionListeners();
        });
    }

    _culculateCollections(isFirstCals) {
        return new Promise(resolve => {
            if (isFirstCals) {
                this._clearLabelCollections();
            }
            this._collections.each((collection) => {
                let labelCollection;
                if (isFirstCals) {
                    labelCollection = new GeoObjectCollection();
                    this._labelsCollections.add(labelCollection);
                }
                collection.each((geoObject) => {
                    if (isFirstCals) {
                        this._culculateGeoObject(geoObject, labelCollection).then(() => {
                            this._culculateLabelData(geoObject);
                        });
                    } else {
                        this._culculateLabelData(geoObject);
                    }
                });
            });
            resolve();
        });
    }

    _culculateLabelData(geoObject) {
        let data = geoObject.properties.get('labelData');
        if (!data) {
            return;
        }
        let {
            data: labelData, autoCenter, label
        } = data;
        labelData = labelData[this._map.getZoom()];
        label = label.getPlacemark();

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

    _culculateGeoObject(geoObject, labelCollection) {
        const options = this._getOptions(geoObject);
        const properties = this._getProperties(geoObject);
        let labelData = createDefaultLabelData();
        setCenter(labelData, geoObject, properties);
        const labelInst = new Label(geoObject, options, this._labelLayout, labelCollection);
        labelInst.addToCollection();
        return labelInst.getPlacemark().getOverlay().then(overlay => overlay.getLayout()).then(layout => {
            const size = layout.getElement().firstChild.getBoundingClientRect();
            labelInst.culculateLabelSize(size);
            labelInst._initEvents();
            setZoomVisibility(this._map, labelData, geoObject, size, options.labelForceVisibleZoom);
            labelData.label = labelInst;
            geoObject.properties.set('labelData', labelData);
        });
    }

    _getOptions(obj) {
        const result = {};
        CONFIG.options.forEach((key) => {
            result[key] = obj.options.get(key, undefined);
        });
        return result;
    }

    _getProperties(obj) {
        const result = {};
        CONFIG.properties.forEach((key) => {
            result[key] = obj.properties.get(key, undefined);
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
        this._map.events.add('boundschange', this._mapBoundsChange, this);
    }

    _initCollectionListeners() {
        this._collections.events.add(['add', 'remove'], this._collectionEvents, this);
    }

    _mapBoundsChange(event) {
        if (event.get('newZoom') !== event.get('oldZoom')) {
            this._culculateCollections();
        }
    }

    _collectionEvents(event) {
        switch (event.get('type')) {
            case 'add': { }
            case 'remove': {
                //TODO сделать оптимизированное удаление/добавление, чтобы не пересчитывать все
                this._culculateCollections(true);
                break;
            }
        }
    }

    _deleteListeners() {
        this._collections.events.remove(['add', 'remove'], this._collectionEvents, this);
        this._map.events.remove('boundschange', this._mapBoundsChange, this);
    }
}

export default Polylabel;
