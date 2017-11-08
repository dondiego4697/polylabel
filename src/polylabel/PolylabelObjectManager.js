import PBase from 'src.polylabel.PolylabelBase';
import DataManager from 'data.Manager';
import Monitor from 'Monitor';
import ObjectManager from 'ObjectManager';
import Label from 'src.label.ObjectManager.Label';
import nextTick from 'system.nextTick';
import EventManager from 'event.Manager';

export default class PolylabelObjectManager extends PBase {
    constructor(map, objectManager) {
        super(map);    
        this._map = map;
        this._polygonsObjectManager = objectManager;
        this._labelsObjectManager = new ObjectManager();
        this._labelsState = new WeakMap();
        this._currentConfiguredVisibility = new WeakMap();
        this._currentVisibility = new WeakMap();
        this._init();
    }

    destroy() {
        this._deleteLabelsOverlaysListeners();
        this._deleteLabelStateListeners();
        this._deletePolygonsListeners();
        this._deletePolygonsObjectsListeners();
        this._deleteLabelsOMListeners();
    }

    /**
     * Возвращает состояние подписи для указанного полигона
     */
    getLabelState(polygon) {
        return this._labelsState.get(polygon);
    }

    /**
     * Возвращает статус текущей видимости для полигона (автоматически рассчитанный)
     */
    getConfiguredVisibility(polygon) {
        return this._currentConfiguredVisibility.get(polygon);
    }

    /**
     * Возвращает статус текущей видимости для полигона
     */
    getCurrentVisibility(polygon) {
        return this._currentVisibility.get(polygon);
    }

    _init() {
        this._map.geoObjects.add(this._labelsObjectManager);
        this._initLabelsOverlaysListeners();        
        this._initPolygonsObjectsListeners();
        this._initPolygonsListeners();
        this._initLabelsOMListeners();
        
        this._firstCalculatePolygons();
        this._initMapListeners();
    }

    /**
     * Рассчитывает данные для подписей полигонов и устанавливает их для текущего зума
     */
    _firstCalculatePolygons() {
        this._calculatePolygons(label => {
            label.createPlacemarks();
            label.addToObjectManager();
        });
    }

    /**
     * Устанавливает данные для подписей для текущего зума
     */
    _calculatePolygons(callback) {
        return new Promise(resolve => {
            this._polygonsObjectManager.objects.each(polygon => {
                if (polygon.geometry.type === 'Polygon') {
                    this._calculatePolygonLabelData(polygon).then(label => {
                        this._setInLabelState(polygon, 'label', label); 
                        this._initLabelStateListener(polygon);                        
                        callback(label);                   
                    });
                }
            });
            resolve();
        });
    }

    /**
     * Рассчитывает данные для подписи полигона
     * Создает подпись
     */
    _calculatePolygonLabelData(polygon, isLabelCreated) {
        const options = this.getOptions(polygon);
        const zoomRangeOptions = this.getZoomRangeOptions(polygon);

        const label = (isLabelCreated) ?
            this._getFromLabelState(polygon, 'label') :
            new Label(this._map, polygon, this._labelsObjectManager);
        
        label.setLabelData(options, zoomRangeOptions);
        return Promise.resolve(label);
    }

    /**
     * Анализирует данные о подписи полигона и устанавливает параметры подписи
     */
    _analyzeAndSetLabelData(polygon, types, label, visibleState) {
        const data = label.setDataByZoom(this._map.getZoom(), types, visibleState);

        this._setCurrentConfiguredVisibility(polygon, data.currentConfiguredVisibileType);
        this._setCurrentVisibility(polygon, data.currentVisibleType);
    }

    _setCurrentConfiguredVisibility(polygon, type) {
        this._currentConfiguredVisibility.set(polygon, type);
    }

    _setCurrentVisibility(polygon, type) {
        this._currentVisibility.set(polygon, ['dot', 'label'].indexOf(type) !== -1 ? type : 'none');
    }

    /**
     * Слушатель на изменение состояния видимости подписи у полигона
     */
    _initLabelStateListener(polygon) {
        const monitor = new Monitor(this._labelsState.get(polygon));
        this._setInLabelState(polygon, 'labelMonitor', monitor);
        monitor.add('visible', (newValue) => {
            setTimeout(() => {
                if (this._dblClick) {
                    this._dblClick = false;
                    return;
                }
                this._analyzeAndSetLabelData(
                    polygon,
                    ['dot', 'label'],
                    this._getFromLabelState(polygon, 'label'),
                    newValue
                );
            }, 100);
        });
    }

    _initLabelsOverlaysListeners() {
        this._labelsObjectManager.objects.overlays.events.add(['add', 'remove'], this._labelsOverlaysEventHandler, this);
    }

    _getLabelType(labelId) {
        return labelId.indexOf('label#') !== -1 ? 'label' : 'dot';
    }

    _labelOverlaysGeometryChangeHandler(event) {
        const overlay = event.get('target');
        const labelId = overlay._data.id;

        overlay.getLayout().then(layout => {
            const labelType = this._getLabelType(labelId);
            const label = this._labelsObjectManager.objects.getById(labelId);
            if (!label) return;

            const polygon = label.properties.polygon;
            const labelInst = this._getFromLabelState(polygon, 'label');
            labelInst.setLayout(labelType, layout);
            this._analyzeAndSetLabelData(polygon, [labelType], labelInst);
        });
    }

    _labelsOverlaysEventHandler(event) {
        const labelId = event.get('objectId');
        const labelType = this._getLabelType(labelId);
        const overlay = event.get('overlay');

        switch (event.get('type')) {
            case 'add': {
                overlay.events.add('geometrychange', this._labelOverlaysGeometryChangeHandler, this);
                nextTick(() => {
                    overlay.getLayout().then(layout => {
                        const label = this._labelsObjectManager.objects.getById(labelId);
                        if (!label) return;

                        const polygon = label.properties.polygon;
                        const labelInst = this._getFromLabelState(polygon, 'label');
                        labelInst.setLayout(labelType, layout);
                        this._analyzeAndSetLabelData(polygon, [labelType], labelInst);
                    });
                });
                break;
            }
            case 'remove': {
                overlay.events.remove('geometrychange', this._labelOverlaysGeometryChangeHandler, this);
                break;
            }
        }
    }

    _setInLabelState(polygon, key, value) {
        let labelState = this._labelsState.get(polygon);
        if (!labelState) {
            labelState = new DataManager();
            this._labelsState.set(polygon, labelState);
        }
        labelState.set(key, value);
    }

    _getFromLabelState(polygon, key) {
        let labelState = this._labelsState.get(polygon);
        if (labelState) {
            return labelState.get(key);
        }
    }

    _clearVisibilityInLabelsState() {
        this._polygonsObjectManager.objects.each(polygon => {
            this._setInLabelState(polygon, 'visible', undefined);
        });
    }

    _initMapListeners() {
        this.initMapListeners((type) => {
            if (type === 'dblclick') {
                this._dblClick = true;                
            }
            if (type === 'boundschange') {
                this._clearVisibilityInLabelsState();
            }
        });
    }

    _initPolygonsObjectsListeners() {
        this._polygonsObjectManager.objects.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
    }

    _polygonCollectionEventHandler(event) {
        switch (event.get('type')) {
            case 'add': {
                const polygon = event.get('child');
                this._recalculateNewPolygon(polygon);
                break;
            }
            case 'remove': {
                const polygon = event.get('child');
                let labelInst = this._getFromLabelState(polygon, 'label');
                if (labelInst) {
                    labelInst.destroy();
                }
                break;
            }
        }
    }

    _recalculateNewPolygon(polygon) {
        if (polygon.geometry.type === 'Polygon') {
            this._calculatePolygonLabelData(polygon).then(label => {
                this._setInLabelState(polygon, 'label', label); 
                this._initLabelStateListener(polygon);    
                label.createPlacemarks();
                label.addToObjectManager();                    
            });
        }
    }

    _initPolygonsListeners() {
        this._polygonsObjectManager.objects.events.add(
            ['optionschange', 'objectoptionschange'],
            this._onPolygonOptionsChangeHandler,
            this
        );
    }

    _onPolygonOptionsChangeHandler(event) {
        const polygon = this._polygonsObjectManager.objects.getById(event.get('objectId'));
        if (!polygon) return;
        
        this._calculatePolygonLabelData(polygon, true).then((label) => {            
            label.setVisibilityForce('none');
            this._setInLabelState(polygon, 'label', label);

            label.setLayoutTemplate();
            label.setNewOptions(polygon.options);

            this._analyzeAndSetLabelData(polygon, ['dot', 'label'], this._getFromLabelState(polygon, 'label'));
        });
    }

    _initLabelsOMListeners() {
        let controller = {
            onBeforeEventFiring: (events, type, event) => {
                const labelId = event.get('objectId');
                if (!labelId) return false;

                let polygonId = labelId.split('#')[1];
                polygonId = isNaN(Number(polygonId)) ? polygonId : Number(polygonId);

                const polygon = this._polygonsObjectManager.objects.getById(polygonId);
                const label = this._labelsObjectManager.objects.getById(labelId);
                if (label && label.options.pane === 'phantom' || !polygon) return false;   
                
                this._polygonsObjectManager.events.fire(`label${type}`, {
                    objectId: polygonId,
                    type: `label${type}`
                });

                return false;
            }
        };
        let eventManager = new EventManager({
            controllers: [controller]
        });
        this._labelsObjectManager.events.setParent(eventManager);
    }

    _deleteLabelStateListeners() {
        this._polygonsObjectManager.objects.each(polygon => {
            if (polygon.geometry.type === 'Polygon') {
                this._deleteLabelStateListener(polygon);
            }
        });
    }

    _deleteLabelStateListener(polygon) {
        const monitor = this._getFromLabelState(polygon, 'labelMonitor');
        if (monitor) {
            monitor.removeAll();
        }
    }

    _deleteLabelsOverlaysListeners() {
        this._labelsObjectManager.objects.overlays.events.remove(['add', 'remove'], this._labelsOverlaysEventHandler, this);        
    }

    _deletePolygonsListeners() {
        this._polygonsObjectManager.objects.events.remove(['optionschange', 'objectoptionschange'],
            this._onPolygonOptionsChangeHandler, this);
    }

    _deletePolygonsObjectsListeners() {
        this._polygonsObjectManager.objects.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
        this.destroyMapListeners();
    }

    /**
     * Уничтожаем каждую подпись у всех полигонов
     */
    _deleteLabelsOMListeners() {
        this._polygonsObjectManager.objects.each(polygon => {
            const labelInst = this._getFromLabelState(polygon, 'label');
            if (polygon.geometry.type === 'Polygon' && labelInst) {
                labelInst.destroy();
            }
        });
        this._clearLabels();
    }

    _clearLabels() {
        this._labelsObjectManager.removeAll();
    }
}
