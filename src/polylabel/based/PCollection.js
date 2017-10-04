import PBased from 'PBased';
import CONFIG from 'config';
import LabelForCollection from 'LabelForCollection';
import setCenter from 'setCenter';
import setZoomVisibilityForGeoObject from 'setZoomVisibilityForGeoObject';
import setForceVisibleZoom from 'setForceVisibleZoom';
import parseZoomData from 'parseZoomData';
import createDefaultLabelData from 'createDefaultLabelData';
import GeoObjectCollection from 'GeoObjectCollection';
import DataManager from 'data.Manager';
import Monitor from 'Monitor';
import nextTick from 'system.nextTick';

class PCollection extends PBased {

    constructor(map, polygonsCollection) {
        super(map);
        this._map = map;
        this._labelsCollection = new GeoObjectCollection();
        this._labelsState = new WeakMap();
        this._polygonsCollection = polygonsCollection;
        this._currentConfiguredVisibility = new WeakMap();
        this._currentVisibility = new WeakMap();
        this._initData();
    }

    destroy() {
        this._deleteLabelStateListeners();
        this._deletePolygonsListeners();
        this._deletePolygonCollectionListeners();
        this._clearLabelCollection();
        this._map.geoObjects.remove(this._labelsCollection);
    }

    getLabelState(polygon) {
        return this._labelsState.get(polygon);
    }

    getConfiguredVisibility(polygon) {
        return this._currentConfiguredVisibility.get(polygon);
    }

    getCurrentVisibility(polygon) {
        return this._currentVisibility.get(polygon);
    }

    _initData() {
        this._map.geoObjects.add(this._labelsCollection);
        this._calculateCollections(true).then(() => {
            this._initMapListeners();
            this._initPolygonCollectionListeners();
            this._initPolygonsListeners();
        });
    }

    _calculateCollections(isFirstCalc) {
        let promises = [];
        if (isFirstCalc) {
            this._clearLabelCollection();
        }
        this._polygonsCollection.each((polygon) => {
            if (isFirstCalc) {
                this._setLabelState(polygon, 'visible', undefined);
                this._initLabelStateListener(polygon);
                this._calculatePolygonLabelData(polygon).then((labelData) => {
                    this._setLabelState(polygon, '_labelData', labelData);
                    promises.push(this._analyzeAndSetLabelData(this._map, polygon, this._getLabelState(polygon, '_labelData')));
                });
            } else {
                promises.push(this._analyzeAndSetLabelData(this._map, polygon, this._getLabelState(polygon, '_labelData')));
            }
        });
        return Promise.all(promises);
    }

    _clearLabelCollection() {
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
        setCenter(labelData, coordinates, options.labelCenterCoords);

        let labelInst;
        if (isLabelInstCreated) {
            labelInst = this._getLabelState(polygon, '_labelData').label;
        } else {
            labelInst = new LabelForCollection(polygon, options, properties, this._labelsCollection);
        }
        labelData.label = labelInst;

        return new Promise(resolve => {
            labelInst.addToCollection(['dot', 'label']).then(() => {
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
                setZoomVisibilityForGeoObject(this._map, labelData, coordinates[labelData.polygonIndex], labelInst).then(() => {
                    resolve(labelData);
                });
            });
        });
    }

    _analyzeAndSetLabelData(map, polygon, labelData, visibleState) {
        return new Promise(resolve => {
            if (!labelData) {
                resolve();
                return;
            }
            let { zoomInfo, autoCenter, label } = labelData;
            zoomInfo = zoomInfo[map.getZoom()];
            this._setCurrentConfiguredVisibility(polygon, zoomInfo.visible, zoomInfo.visibleForce);
            label._setCoordinates(zoomInfo.center || autoCenter);
            visibleState = visibleState ? visibleState : zoomInfo.visibleForce;
            let visibleType = visibleState === 'auto' ? zoomInfo.visible : visibleState;
            this._setCurrentVisibility(polygon, visibleType);
            label._setVisibility(visibleType);
            if (['dot', 'label'].includes(visibleState)) {
                label._setSize(visibleState, visibleState === 'dot' ? labelData.dotSize : zoomInfo.labelSize);
            }
            label._setStyles(zoomInfo.style);
            resolve();
        });
    }

    _setCurrentConfiguredVisibility(polygon, visible, visibleForce) {
        let result = visibleForce && ['dot', 'label', 'none'].includes(visibleForce) ?
            visibleForce : visible;
        this._currentConfiguredVisibility.set(polygon, result);
    }

    _setCurrentVisibility(polygon, type) {
        this._currentVisibility.set(polygon, ['dot', 'label'].includes(type) ? type : 'none');
    }

    _recalculateNewPolygon(polygon) {
        this._calculatePolygonLabelData(polygon).then((labelData) => {
            this._setLabelState(polygon, '_labelData', labelData);
            this._analyzeAndSetLabelData(this._map, polygon, this._getLabelState(polygon, '_labelData'));
        });
    }

    _setLabelState(polygon, key, value) {
        let labelState = this._labelsState.get(polygon);
        if (!labelState) {
            labelState = new DataManager();
            this._labelsState.set(polygon, labelState);
        }
        labelState.set(key, value);
    }

    _getLabelState(polygon, key) {
        let labelState = this._labelsState.get(polygon);
        if (labelState) {
            return labelState.get(key);
        }
    }

    _clearVisibilityInLabelsState() {
        this._polygonsCollection.each(polygon => {
            this._setLabelState(polygon, 'visible', undefined);
        });
    }

    _polygonCollectionEventHandler(event) {
        switch (event.get('type')) {
            case 'add':
                {
                    this._recalculateNewPolygon(event.get('child'));
                    break;
                }
            case 'remove':
                {
                    this._getLabelState(event.get('child'), '_labelData').label.destroy();
                    break;
                }
        }
    }

    _deleteLabelStateListeners() {
        this._polygonsCollection.each(polygon => {
            this._deleteLabelStateListener(polygon);
        });
    }

    _deleteLabelStateListener(polygon) {
        let monitor = this._getLabelState(polygon, 'labelMonitor');
        if (monitor) {
            monitor.removeAll();
        }
    }

    _initLabelStateListener(polygon) {
        let monitor = new Monitor(this._labelsState.get(polygon));
        this._setLabelState(polygon, 'labelMonitor', monitor);
        monitor.add('visible', (newValue) => {
            this._analyzeAndSetLabelData(this._map, polygon, this._getLabelState(polygon, '_labelData'), newValue);
        });
    }

    _initPolygonsListeners() {
        this._polygonsCollection.each(polygon => {
            this._initPolygonListener(polygon);
        });
    }

    _initPolygonListener(polygon) {
        polygon.events.add(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
        polygon.events.add('parentchange', this._onPolygonParentChangeHandler, this);
    }

    _onPolygonParentChangeHandler(event) {
        this._isPolygonParentChange = true;
    }

    _onPolygonOptionsChangeHandler(event) {
        nextTick(() => {
            if (!this._isPolygonParentChange) {
                const polygon = event.get('target');
                let labelData = this._getLabelState(polygon, '_labelData');
                labelData.label._setLayoutTemplate(['label', 'dot'], [
                    polygon.options.get('labelLayout'),
                    polygon.options.get('labelDotLayout')
                ]).then(() => {
                        this._calculatePolygonLabelData(polygon, true).then(labelData => {
                            this._setLabelState(polygon, '_labelData', labelData);
                            this._analyzeAndSetLabelData(this._map, polygon, this._getLabelState(polygon, '_labelData'));
                        });
                    });
            }
            this._isPolygonParentChange = false;
        });
    }

    _initPolygonCollectionListeners() {
        this._polygonsCollection.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
    }

    _initMapListeners() {
        this.initMapListeners(() => {
            this._clearVisibilityInLabelsState();
            this._calculateCollections();
        });
    }

    _deletePolygonCollectionListeners() {
        this._polygonsCollection.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
        this.destroyMapListeners();
    }

    _deletePolygonsListeners() {
        this._polygonsCollection.each((polygon) => {
            this._deletePolygonListener(polygon);
        });
    }

    _deletePolygonListener(polygon) {
        polygon.events.remove(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
        polygon.events.remove('parentchange', this._onPolygonParentChangeHandler, this);
    }
}

export default PCollection;
