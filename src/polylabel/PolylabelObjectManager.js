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
        this._layoutTemplateCache = {};

        this._initData();
    }

    destroy() {
        this._deleteLabelStateListeners();
        this._deletePolygonsListeners();
        this._deletePolygonCollectionListeners();
        this._deleteLabelCollection();
        this._layoutTemplateCache = null;
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

    _initData() {
        this._map.geoObjects.add(this._labelsObjectManager);
        this._initOverlaysListener();
        this._firstCalculatePolygons();

        this._initMapListeners();
        this._initPolygonCollectionListeners();
        this._initPolygonsListeners();
        this._initLabelCollectionListeners();
    }

    /**
     * Рассчитывает данные для подписей полигонов и устанавливает их для текущего зума
     */
    _firstCalculatePolygons() {
        this._clearLabels();
        this._polygonsObjectManager.objects.each(polygon => {
            if (polygon.geometry.type === 'Polygon') {
                this._setInLabelState(polygon, 'visible', undefined);
                this._setInLabelState(polygon, 'isNeedUpdate', true);
                this._initLabelStateListener(polygon);
                this._calculatePolygonLabelData(polygon).then((labelInst) => {
                    this._setInLabelState(polygon, 'label', labelInst);
                    labelInst.addToObjectManager();
                });
            }
        });
    }

    /**
     * Устанавливает данные для подписей для текущего зума
     */
    _calculatePolygons() {
        this._polygonsObjectManager.objects.each((polygon) => {
            if (polygon.geometry.type === 'Polygon') {
                this._analyzeAndSetLabelData(polygon, ['dot', 'label'], this._getFromLabelState(polygon, 'label'));
            }
        });
    }

    /**
     * Анализирует данные о подписи полигона и устанавливает параметры подписи
     */
    _analyzeAndSetLabelData(polygon, types, labelInst, visibleState) {
        if (!labelInst) {
            return Promise.resolve();
        }
        const data = labelInst.setDataByZoom(this._map.getZoom(), types, visibleState);
        this._setCurrentConfiguredVisibility(polygon, data.visible, data.visibleForce);
        this._setCurrentVisibility(polygon, data.visibleType);

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

    /**
     * Рассчитывает данные для подписи полигона
     * Создает подпись
     */
    _calculatePolygonLabelData(polygon, isLabelInstCreated) {
        const options = this.getOptions(polygon);
        const zoomRangeOptions = this.getZoomRangeOptions(polygon);

        const labelInst = (isLabelInstCreated) ?
            this._getFromLabelState(polygon, 'label') :
            new Label(this._map, polygon, this._labelsObjectManager, this._layoutTemplateCache);
        labelInst.setLabelData(options, zoomRangeOptions);

        return Promise.resolve(labelInst);
    }

    /**
     * Слушатель на изменение состояния видимости подписи у полигона
     */
    _initLabelStateListener(polygon) {
        const monitor = new Monitor(this._labelsState.get(polygon));
        this._setInLabelState(polygon, 'labelMonitor', monitor);
        monitor.add('visible', (newValue) => {
            this._analyzeAndSetLabelData(
                polygon,
                ['dot', 'label'],
                this._getFromLabelState(polygon, 'label'),
                newValue
            );
        });
    }

    _initOverlaysListener() {
        this._labelsObjectManager.objects.overlays.events.add('add', this._overlaysAddHandler, this);
    }

    _overlaysAddHandler(event) {
        const objectId = String(event.get('objectId'));
        const objectType = objectId.indexOf('label#') !== -1 ? 'label' : 'dot';

        let overlay = event.get('overlay');
        nextTick(() => {
            overlay.getLayout().then(layout => {
                const label = this._labelsObjectManager.objects.getById(objectId);
                if (label) {
                    const polygon = label.properties.labelPolygon;
                    const labelInst = this._getFromLabelState(polygon, 'label');
                    labelInst.setLayout(objectType, layout);

                    this._analyzeAndSetLabelData(polygon, [objectType], labelInst);
                }
            });
        });
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

    _clearLabels() {
        this._labelsObjectManager.removeAll();
    }

    _clearVisibilityInLabelsState() {
        this._polygonsObjectManager.objects.each(polygon => {
            this._setInLabelState(polygon, 'visible', undefined);
        });
    }

    _initMapListeners() {
        this.initMapListeners(() => {
            this._clearVisibilityInLabelsState();
            this._calculatePolygons();
        });
    }

    _initPolygonCollectionListeners() {
        this._polygonsObjectManager.objects.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
    }

    _polygonCollectionEventHandler(event) {
        switch (event.get('type')) {
            case 'add': {
                const polygon = this._polygonsObjectManager.objects.getById(event.get('objectId'));
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
        this._calculatePolygonLabelData(polygon).then((labelInst) => {
            this._setInLabelState(polygon, 'label', labelInst);
            this._setInLabelState(polygon, 'visible', undefined);
            this._setInLabelState(polygon, 'isNeedUpdate', true);
            this._initLabelStateListener(polygon);
            labelInst.addToObjectManager();
        });
    }

    _initPolygonsListeners() {
        this._polygonsObjectManager.objects.events.add(
            ['optionschange', 'objectoptionschange'],
            this._onPolygonOptionsChangeHandler, this);
    }

    _onPolygonOptionsChangeHandler(event) {
        const polygon = this._polygonsObjectManager.objects.getById(event.get('objectId'));
        if (!polygon) return;

        this._calculatePolygonLabelData(polygon, true).then((labelInst) => {
            labelInst.setVisibility('phantom');
            this._setInLabelState(polygon, 'label', labelInst);

            labelInst.setLayoutTemplate();
            labelInst.setNewOptions(polygon.options);

            this._getLabelsOverlays(event.get('objectId')).then(layouts => {
                const types = ['dot', 'label'];
                layouts.forEach((l, i) => {
                    labelInst.setLayout(types[i], l);
                });
                this._analyzeAndSetLabelData(polygon, this._getFromLabelState(polygon, 'label'));
            });
        });
    }

    _getLabelsOverlays(polygonId) {
        const overlays = ['dot', '_dot', 'label', '_label'].reduce((result, key) => {
            let overlay = this._labelsObjectManager.objects.overlays.getById(`${key}#${polygonId}`);
            const rKey = key[0] === '_' ? key.slice(1) : key;
            if (overlay) {
                result[rKey] = overlay;
            }
            return result;
        }, {});

        const promises = Object.keys(overlays).map(key => {
            return overlays[key].getLayout();
        });

        return Promise.all(promises);
    }

    _initLabelCollectionListeners() {
        let controller = {
            onBeforeEventFiring: (events, type, event) => {
                const labelId = event.get('objectId');
                if (!labelId) return false;

                let polygonId = labelId.split('#')[1];
                let polygon = this._polygonsObjectManager.objects.getById(polygonId);
                let label = this._labelsObjectManager.objects.getById(labelId);

                if (label && label.options.pane === 'phantom') return false;

                if (polygon) {
                    this._polygonsObjectManager.events.fire(`label${type}`, {
                        objectId: polygonId,
                        type: `label${type}`
                    });
                }
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

    _deletePolygonsListeners() {
        this._polygonsObjectManager.objects.events.remove(['optionschange', 'objectoptionschange'],
            this._onPolygonOptionsChangeHandler, this);
    }

    _deletePolygonCollectionListeners() {
        this._polygonsObjectManager.objects.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
        this.destroyMapListeners();
    }

    /**
     * Уничтожаем каждую подпись у всех полигонов
     */
    _deleteLabelCollection() {
        this._polygonsObjectManager.objects.each(polygon => {
            const labelInst = this._getFromLabelState(polygon, 'label');
            if (polygon.geometry.type === 'Polygon' && labelInst) {
                labelInst.destroy();
            }
        });
        this._clearLabels();
    }
}
