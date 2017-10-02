import PBased from 'PBased';
import LabelForCollection from 'LabelForCollection';
import setCenter from 'setCenter';
import setZoomVisibilityForGeoObject from 'setZoomVisibilityForGeoObject';
import setForceVisibleZoom from 'setForceVisibleZoom';
import parseZoomData from 'parseZoomData';
import createDefaultLabelData from 'createDefaultLabelData';
import GeoObjectCollection from 'GeoObjectCollection';

class PCollection extends PBased {

    constructor(map, polygonsCollection) {
        super(map);
        this._map = map;
        this._labelsCollection = new GeoObjectCollection();
        this._labelsState = new WeakMap();
        this._polygonsCollection = polygonsCollection;
        this._initData();
    }

    /**
     * @ignore
     */
    _updateAll() {
        this._calculateCollections(true);
    }

    destroy() {
        this._clearLabelCollections();
        this._deleteListeners();
    }

    getLabelState(polygon) {
        return this._labelsState(polygon);
    }

    _initData() {
        this._map.geoObjects.add(this._labelsCollection);
        this._calculateCollections(true).then(() => {
            this._initMapListeners();
            this._initCollectionListeners();
        });
    }

    _calculateCollections(isFirstCalc) {
        let promises = [];
        if (isFirstCalc) {
            this._clearLabelCollections();
        }
        this._polygonsCollection.each((polygon) => {
            if (isFirstCalc) {
                this._initPolygonListeners(polygon);
                this._calculatePolygonLabelData(polygon).then((labelData) => {
                    polygon.properties.set('_labelData', labelData);
                    promises.push(PCollection._analyzeAndSetLabelData(this._map, polygon));
                });
            } else {
                promises.push(PCollection._analyzeAndSetLabelData(this._map, polygon));
            }
        });
        return Promise.all(promises);
    }

    _clearLabelCollections() {
        this._deletePolygonsListeners();
        this._labelsCollection.removeAll();
        this._labelsCollection.options.set({
            pane: 'phantom'
        });
    }

    _calculatePolygonLabelData(polygon, isLabelInstCreated) {
        const options = this.getOptions(polygon);
        const properties = this.getProperties(polygon);
        let labelData = createDefaultLabelData();
        setForceVisibleZoom(labelData, options.labelForceVisible);
        const coordinates = polygon.geometry.getCoordinates();
        setCenter(labelData, coordinates, properties.labelCenterCoords);

        let labelInst;
        if (isLabelInstCreated) {
            labelInst = polygon.properties.get('_labelData').label;
        } else {
            labelInst = new LabelForCollection(polygon, options, properties, this._labelsCollection);
        }
        labelData.label = labelInst;

        return new Promise(resolve => {
            labelInst.addToCollection().then(() => {
                let { labelClassName, labelTextColor, labelTextSize } = options;
                labelClassName = parseZoomData(labelClassName);
                labelTextSize = parseZoomData(labelTextSize);
                labelTextColor = parseZoomData(labelTextColor);

                Object.keys(labelData.zoomInfo).forEach(z => {
                    labelData.zoomInfo[z].style = {
                        className: labelClassName ? labelClassName[z] : '',
                        textSize: labelTextSize ? labelTextSize[z] : '',
                        textColor: labelTextColor ? labelTextColor[z] : ''
                    }
                });
                setZoomVisibilityForGeoObject(this._map, labelData, coordinates, labelInst).then(() => {
                    resolve(labelData);
                });
            });
        });
    }

    /**
     * Relative to the current zoom, the options & properties are applied
     * @param {Map} map
     * @param {GeoObject|Object} polygon
     */
    static _analyzeAndSetLabelData(map, polygon) {
        return new Promise(resolve => {
            let labelData = polygon.properties.get('_labelData');
            if (!labelData) {
                resolve();
                return;
            }

            let { zoomInfo, autoCenter, label } = labelData;
            zoomInfo = zoomInfo[map.getZoom()];
            label._setCoordinates(zoomInfo.center || autoCenter);
            const isVisible = typeof zoomInfo.visibleForce === 'undefined' ? zoomInfo.visible : zoomInfo.visibleForce;
            label._setVisibility(isVisible);
            label._setStyles(zoomInfo.style);
            resolve();
        });
    }

    _recalculateNewPolygon(polygon) {
        this._calculatePolygonLabelData(polygon).then((labelData) => {
            polygon.properties.set('_labelData', labelData);
            PCollection._analyzeAndSetLabelData(this._map, polygon);
        });
    }

    _collectionEventHandler(event) {
        switch (event.get('type')) {
            case 'add':
                {
                    this._recalculateNewPolygon(event.get('child'));
                    break;
                }
            case 'remove':
                {
                    event.get('child').properties.get('_labelData').label.destroy();
                    break;
                }
        }
    }

    _initPolygonListeners(polygon) {
        polygon.events.add('optionschange', this._onPolygonEventHandler, this);
    }

    _onPolygonEventHandler(event) {
        const polygon = event.get('target');
        polygon.properties.get('_labelData').label._setLayout(polygon.options.get('labelLayout'))
            .then(() => {
                this._calculatePolygonLabelData(polygon, true).then(labelData => {
                    polygon.properties.set('_labelData', labelData);
                    PCollection._analyzeAndSetLabelData(this._map, polygon)
                });
            });
    }

    _initCollectionListeners() {
        this._polygonsCollection.events.add(['add', 'remove'], this._collectionEventHandler, this);
    }

    _initMapListeners() {
        this.initMapListeners(() => {
            this._calculateCollections();
        });
    }

    _deleteListeners() {
        this._polygonsCollection.events.remove(['add', 'remove'], this._collectionEventHandler, this);
        this.destroyMapListeners();
    }

    _deletePolygonsListeners() {
        this._polygonsCollection.each((polygon) => {
            polygon.events.remove('optionschange', this._onPolygonEventHandler, this);
        });
    }
}

export default PCollection;
