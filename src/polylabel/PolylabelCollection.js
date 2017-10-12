import PBased from 'src.polylabel.PolylabelBased';
import Label from 'src.label.GeoObjectCollection.Label';
import setCenter from 'src.util.center.setCenter';
import setZoomVisibilityForGeoObject from 'src.util.zoom.setZoomVisibilityForGeoObject';
import setForceVisibleZoom from 'src.util.zoom.setForceVisibleZoom';
import parseZoomData from 'src.util.zoom.parseZoomData';
import createDefaultLabelData from 'src.util.createDefaultLabelData';
import GeoObjectCollection from 'GeoObjectCollection';
import Monitor from 'Monitor';
import nextTick from 'system.nextTick';
import DataManager from 'data.Manager';
import EventManager from 'event.Manager';
import Event from 'Event';

export default class PolylabelCollection extends PBased {

    constructor(map, polygonsCollection) {
        super(map);
        this._map = map;
        this._labelsCollection = new GeoObjectCollection();
        this._labelsState = new WeakMap();
        this._polygonsCollection = polygonsCollection;
        this._currentConfiguredVisibility = new WeakMap();
        this._currentVisibility = new WeakMap();
        this._layoutTemplateCache = {};
        this._initData();
    }

    destroy() {
        this._deleteLabelStateListeners();
        this._deletePolygonsListeners();
        this._deletePolygonCollectionListeners();
        this._deleteLabelCollection();
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
        this._firstCalculatePolygonsCollection().then(() => {
            this._initMapListeners();
            this._initPolygonCollectionListeners();
            this._initPolygonsListeners();
            this._initLabelCollectionListeners();
        });
    }

    _firstCalculatePolygonsCollection() {
        this._clearLabelCollection();
        let promises = [];
        this._polygonsCollection.each((polygon) => {
            this._setLabelState(polygon, 'visible', undefined);
            this._initLabelStateListener(polygon);
            this._calculatePolygonLabelData(polygon).then((labelData) => {
                this._setLabelState(polygon, '_labelData', labelData);
                promises.push(this._analyzeAndSetLabelData(this._map, polygon, this._getLabelState(polygon, '_labelData')));
            });
        });
        return Promise.all(promises);
    }

    _calculatePolygonsCollection() {
        let promises = [];
        this._polygonsCollection.each((polygon) => {
            promises.push(this._analyzeAndSetLabelData(this._map, polygon, this._getLabelState(polygon, '_labelData')));
        });
        return Promise.all(promises);
    }

    _clearLabelCollection() {
        this._labelsCollection.removeAll();
        this._labelsCollection.options.set({
            pane: 'phantom'
        });
    }

    _deleteLabelCollection() {
        this._polygonsCollection.each(polygon => {
            this._getLabelState(polygon, '_labelData').label.destroy();
        });
        this._clearLabelCollection();
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
            labelInst = new Label(polygon, options, properties, this._labelsCollection, this._layoutTemplateCache);
        }
        labelData.label = labelInst;

        return labelInst.addToCollection().then(() => {
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
        })
            .then(() => setZoomVisibilityForGeoObject(this._map, labelData, coordinates[labelData.polygonIndex], labelInst))
            .then(() => labelData);
    }

    _analyzeAndSetLabelData(map, polygon, labelData, visibleState) {
        if (!labelData) {
            return Promise.resolve();
        }
        //TODO наверное стоит завернуть установку всех параметров в Label
        let { zoomInfo, autoCenter, label } = labelData;
        zoomInfo = zoomInfo[map.getZoom()];
        this._setCurrentConfiguredVisibility(polygon, zoomInfo.visible, zoomInfo.visibleForce);
        label.setCoordinates(zoomInfo.center || autoCenter);
        visibleState = visibleState ? visibleState : zoomInfo.visibleForce;
        let visibleType = visibleState === 'auto' ? zoomInfo.visible : visibleState;
        this._setCurrentVisibility(polygon, visibleType);
        label.setVisibility(visibleType);
        if (['dot', 'label'].includes(visibleState)) {
            label.setSize(visibleState, visibleState === 'dot' ? labelData.dotSize : zoomInfo.labelSize);
        }
        label.setStyles(zoomInfo.style);
        return Promise.resolve();
    }

    _setCurrentConfiguredVisibility(polygon, visible, visibleForce) {
        let result = visibleForce && ['dot', 'label', 'none'].indexOf(visibleForce) !== -1 ?
            visibleForce : visible;
        this._currentConfiguredVisibility.set(polygon, result);
    }

    _setCurrentVisibility(polygon, type) {
        this._currentVisibility.set(polygon, ['dot', 'label'].indexOf(type) !== -1 ? type : 'none');
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
                this._recalculateNewPolygon(event.get('child'));
                break;
            case 'remove':
                let labelData = this._getLabelState(event.get('child'), '_labelData');
                if (labelData) {
                    labelData.label.destroy();
                }
                break;
        }
    }

    _deleteLabelStateListeners() {
        this._polygonsCollection.each(polygon => {
            this._deleteLabelStateListener(polygon);
        });
    }

    _deleteLabelStateListener(polygon) {
        const monitor = this._getLabelState(polygon, 'labelMonitor');
        if (monitor) {
            monitor.removeAll();
        }
    }

    _initLabelStateListener(polygon) {
        const monitor = new Monitor(this._labelsState.get(polygon));
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
            const polygon = event.get('target');
            let labelData = this._getLabelState(polygon, '_labelData');
            if (this._isPolygonParentChange || !labelData) {
                this._isPolygonParentChange = false;
                return;
            }
            labelData.label.setLayoutTemplate({
                label: polygon.options.get('labelLayout'),
                dot: polygon.options.get('labelDotLayout')
            })
            .then(() => this._calculatePolygonLabelData(polygon, true))
            .then((labelData) => {
                this._setLabelState(polygon, '_labelData', labelData);
                this._analyzeAndSetLabelData(this._map, polygon, this._getLabelState(polygon, '_labelData'));
            });
        });
    }

    _initPolygonCollectionListeners() {
        this._polygonsCollection.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
    }

    _initLabelCollectionListeners() {
        let controller = {
            onBeforeEventFiring: function (events, type, event) {
                if (event.get('target').options.get('pane') === 'phantom') {
                    return false;
                }
                let polygon = event.get('target').properties.get('_labelPolygon');
                if (polygon) {
                    let newEvent = new Event({
                        target: polygon,
                        type: `label${type}`
                    }, event);
                    polygon.events.fire(`label${type}`, newEvent);
                }
                return false;
            }
        }
        let eventManager = new EventManager({
            controllers: [controller]
        });
        this._labelsCollection.events.setParent(eventManager);
    }

    _initMapListeners() {
        this.initMapListeners(() => {
            this._clearVisibilityInLabelsState();
            this._calculatePolygonsCollection();
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
