import Label from 'Label';
import setCenter from 'setCenter';
import createDefaultLabelData from 'createDefaultLabelData';
import setZoomVisibility from 'setZoomVisibility';
import setPresets from 'setPresets';
import CONFIG from 'config';
import createLabelLayout from 'createLabelLayout';
import getMaxFitTextSize from 'getMaxFitTextSize';

class Polylabel {
    /**
     * @param {Map} map
     */
    constructor(map, labelsCollection, polygonsCollection) {
        this._map = map;
        this._polygonsCollection = polygonsCollection;
        this._labelsCollection = labelsCollection;
        this._labelLayout = createLabelLayout;
        this._initData();
    }

    update() {
        this._calculateCollections(true);
    }

    destroy() {
        this._labelsCollection.removeAll();
        this._deleteListeners();
    }

    _initData() {
        setPresets(this._labelsCollection);
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
            this._polygonsCollection.each((geoObject) => {
                if (isFirstCals) {
                    this._calculateGeoObject(geoObject).then(() => {
                        this._calculateAndSetLabelData(geoObject);
                    });
                } else {
                    this._calculateAndSetLabelData(geoObject);
                }
            });
            resolve();
        });
    }

    _calculateAndSetLabelData(geoObject) {
        let labelData = geoObject.properties.get('_labelData');
        if (!labelData) {
            return;
        }
        let {
            zoomInfo,
            autoCenter,
            label
        } = labelData;
        zoomInfo = zoomInfo[this._map.getZoom()];

        label = label.getPlacemark();
        label.geometry.setCoordinates(zoomInfo.center || autoCenter);
        const isVisible = typeof zoomInfo.visibleForce === 'undefined' ? zoomInfo.visible : zoomInfo.visibleForce;
        label.options.set({
            pane: isVisible ? 'places' : 'phantom'
        });
    }

    _calculateGeoObject(geoObject) {
        const options = this._getOptions(geoObject);
        const properties = this._getProperties(geoObject);
        let labelData = createDefaultLabelData();
        setCenter(labelData, geoObject, properties);
        const labelInst = new Label(geoObject, options, this._labelLayout, this._labelsCollection);
        labelInst.addToCollection();
        return labelInst.getPlacemark().getOverlay().then(overlay => overlay.getLayout()).then(layout => {
            const size = layout.getElement().firstChild.getBoundingClientRect();
            labelInst.calculateLabelSize(size);
            labelInst._initEvents();
            setZoomVisibility(this._map, labelData, geoObject, size, options.labelForceVisibleZoom);
            labelData.label = labelInst;
            geoObject.properties.set('_labelData', labelData);
        });
    }

    _recalculateGeoObject(geoObject) {
        this._calculateGeoObject(geoObject).then(() => {
            this._calculateAndSetLabelData(geoObject);
        });
    }

    _getOptions(obj) {
        const result = {};
        CONFIG.options.forEach((key) => {
            result[key] = obj.options.get(key);
        });
        return result;
    }

    _getProperties(obj) {
        const result = {};
        CONFIG.properties.forEach((key) => {
            result[key] = obj.properties.get(key);
        });
        return result;
    }

    _clearLabelCollections() {
        this._labelsCollection.removeAll();
        this._labelsCollection.options.set({
            pane: 'phantom'
        });
    }

    _initCollectionListeners() {
        this._polygonsCollection.events.add(['add', 'remove'], this._onCollectionEvents, this);
    }

    _onMapBoundsChange(event) {
        if (event.get('newZoom') !== event.get('oldZoom')) {
            this._calculateCollections();
        }
    }

    _onCollectionEvents(event) {
        console.log(event);
        switch (event.get('type')) {
            case 'add': {
                this._recalculateGeoObject(event.get('child'));
                break;
            }
            case 'remove': {
                event.get('child').properties.get('_labelData').label.destroy();
                break;
            }
        }
    }

    _initMapListeners() {
        this._map.events.add('boundschange', this._onMapBoundsChange, this);
    }

    _deleteListeners() {
        this._polygonsCollection.events.remove(['add', 'remove'], this._onCollectionEvents, this);
        this._map.events.remove('boundschange', this._onMapBoundsChange, this);
    }
}

export default Polylabel;
