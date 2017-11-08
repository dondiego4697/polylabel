import PBase from 'src.polylabel.PolylabelBase';
import Label from 'src.label.GeoObjectCollection.Label';
import GeoObjectCollection from 'GeoObjectCollection';
import Monitor from 'Monitor';
import nextTick from 'system.nextTick';
import DataManager from 'data.Manager';
import EventManager from 'event.Manager';
import Event from 'Event';

export default class PolylabelCollection extends PBase {
    constructor(map, polygonsCollection) {
        super(map);
                
        this._map = map;
        this._labelsCollection = new GeoObjectCollection();
        this._labelsState = new WeakMap();
        this._polygonsCollection = polygonsCollection;
        this._currentConfiguredVisibility = new WeakMap();
        this._currentVisibility = new WeakMap();
        this._isPolygonParentChange = new WeakMap();
        this._initData();
    }

    destroy() {
        this._deleteLabelStateListeners();
        this._deletePolygonsListeners();
        this._deletePolygonCollectionListeners();
        this._deleteLabelCollection();
        this._map.geoObjects.remove(this._labelsCollection);
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
        this._map.geoObjects.add(this._labelsCollection);
        this._firstCalculatePolygonsCollection().then(() => {
            this._initMapListeners();
            this._initPolygonCollectionListeners();
            this._initPolygonsListeners();
            this._initLabelCollectionListeners();
        });
    }

    /**
     * Рассчитывает данные для подписей полигонов и устанавливает их для текущего зума
     */
    _firstCalculatePolygonsCollection() {
        this._clearLabelCollection();
        let promises = [];
        this._polygonsCollection.each((polygon) => {
            this._setInLabelState(polygon, 'visible', undefined);
            this._initLabelStateListener(polygon);
            this._calculatePolygonLabelData(polygon).then((labelInst) => {
                this._setInLabelState(polygon, 'label', labelInst);
                promises.push(this._analyzeAndSetLabelData(polygon, this._getFromLabelState(polygon, 'label')));
            });
        });
        return Promise.all(promises);
    }

    /**
     * Устанавливает данные для подписей для текущего зума
     */
    _calculatePolygonsCollection() {
        let promises = [];
        this._polygonsCollection.each((polygon) => {
            promises.push(this._analyzeAndSetLabelData(polygon, this._getFromLabelState(polygon, 'label')));
        });
        return Promise.all(promises);
    }

    /**
     * Очистка коллекции подписей
     */
    _clearLabelCollection() {
        this._labelsCollection.removeAll();
        this._labelsCollection.options.set({
            pane: 'phantom'
        });
    }

    /**
     * Уничтожаем каждую подпись у всех полигонов
     */
    _deleteLabelCollection() {
        this._polygonsCollection.each(polygon => {
            const labelInst = this._getFromLabelState(polygon, 'label');
            if (labelInst) {
                labelInst.destroy();
            }
        });
        this._clearLabelCollection();
    }

    /**
     * Рассчитывает данные для подписи полигона
     */
    _calculatePolygonLabelData(polygon, isLabelInstCreated) {
        const options = this.getOptions(polygon);
        const zoomRangeOptions = this.getZoomRangeOptions(polygon);

        const labelInst = (isLabelInstCreated) ?
            this._getFromLabelState(polygon, 'label') :
            new Label(this._map, polygon, this._labelsCollection);
        labelInst.setLabelData(options, zoomRangeOptions);

        return labelInst.addToCollection().then(() => labelInst);
    }

    /**
     * Анализирует данные о подписи полигона и устанавливает параметры подписи
     */
    _analyzeAndSetLabelData(polygon, labelInst, visibleState) {
        if (!labelInst) {
            return Promise.resolve();
        }
        nextTick(() => {
            const data = labelInst.setDataByZoom(this._map.getZoom(), visibleState);
            this._setCurrentConfiguredVisibility(polygon, data.visible, data.visibleForce);
            this._setCurrentVisibility(polygon, data.visibleType);
        });
        return Promise.resolve();
    }

    /**
     * Устанавливает статус текущей видимости для полигона (автоматически рассчитанный)
     */
    _setCurrentConfiguredVisibility(polygon, visible, visibleForce) {
        let result = visibleForce && ['dot', 'label', 'none'].indexOf(visibleForce) !== -1 ?
            visibleForce : visible;
        this._currentConfiguredVisibility.set(polygon, result);
    }

    /**
     * Устанавливает статус текущей видимости для полигона
     */
    _setCurrentVisibility(polygon, type) {
        this._currentVisibility.set(polygon, ['dot', 'label'].indexOf(type) !== -1 ? type : 'none');
    }

    /**
     * Рассчитывает добавленный в коллекцию новый полигон
     */
    _recalculateNewPolygon(polygon) {
        this._calculatePolygonLabelData(polygon).then((labelInst) => {
            this._setInLabelState(polygon, 'label', labelInst);
            this._analyzeAndSetLabelData(polygon, this._getFromLabelState(polygon, 'label'));
            this._initLabelStateListener(polygon);
        });
    }

    /**
     * Устанавливаем значение в state полигона
     */
    _setInLabelState(polygon, key, value) {
        let labelState = this._labelsState.get(polygon);
        if (!labelState) {
            labelState = new DataManager();
            this._labelsState.set(polygon, labelState);
        }
        labelState.set(key, value);
    }

    /**
     * Достаем значение из state полигона
     */
    _getFromLabelState(polygon, key) {
        let labelState = this._labelsState.get(polygon);
        if (labelState) {
            return labelState.get(key);
        }
    }

    /**
     * Сбрасывает состояние visible всех подписей
     * (на новых зумах оно не конфликтовало с рассчитанными данными, тк у state приоритет выше)
     */
    _clearVisibilityInLabelsState(value) {
        this._polygonsCollection.each(polygon => {
            this._setInLabelState(polygon, 'visible', value);
        });
    }

    /**
     * Слушатель на изменение состояния видимости подписи у полигона
     */
    _initLabelStateListener(polygon) {
        const monitor = new Monitor(this._labelsState.get(polygon));
        this._setInLabelState(polygon, 'labelMonitor', monitor);
        monitor.add('visible', (newValue) => {
            this._analyzeAndSetLabelData(polygon, this._getFromLabelState(polygon, 'label'), newValue);
        });
    }

    _initPolygonsListeners() {
        this._polygonsCollection.each(polygon => {
            this._initPolygonListener(polygon);
        });
    }

    /**
     * Создает слушатели событий на полигон
     */
    _initPolygonListener(polygon) {
        polygon.events.add(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
        polygon.events.add('parentchange', this._onPolygonParentChangeHandler, this);
    }

    _onPolygonParentChangeHandler(event) {
        this._isPolygonParentChange.set(event.get('target'), 2);
        // 2 - это кол-во событий, которые слушаем ['optionschange', 'propertieschange']
        // Это необходимо, чтобы при удалении полигона в _onPolygonOptionsChangeHandler
        // не происходило присваивание опций пустой подписи,
        // тк при удалении объекта из коллекции у него меняются все опции
    }

    _onPolygonOptionsChangeHandler(event) {
        nextTick(() => {
            const polygon = event.get('target');
            let labelInst = this._getFromLabelState(polygon, 'label');

            const curr = this._isPolygonParentChange.get(polygon);
            if (curr > 0 || !labelInst) {
                this._isPolygonParentChange.set(event.get('target'), curr - 1);
                return;
            }

            labelInst.setVisibility('phantom');
            //TODO возможно, стоит сделать проверку на шаблоны, если не поменялся, то просто перерасчитать
            labelInst.setLayoutTemplate();

            this._calculatePolygonLabelData(polygon, true).then((labelInst) => {
                this._setInLabelState(polygon, 'label', labelInst);
                this._analyzeAndSetLabelData(polygon, this._getFromLabelState(polygon, 'label'));
            });
        });
    }

    /**
     * Создает слушатели событий на коллекцию полигонов
     */
    _initPolygonCollectionListeners() {
        this._polygonsCollection.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
    }

    _polygonCollectionEventHandler(event) {
        switch (event.get('type')) {
            case 'add': {
                this._recalculateNewPolygon(event.get('child'));
                break;
            }
            case 'remove': {
                this._deleteLabelStateListener(event.get('child'));
                const labelInst = this._getFromLabelState(event.get('child'), 'label');
                if (labelInst) {
                    labelInst.destroy();
                }
                break;
            }
        }
    }

    /**
     * Делает проброс событий с подписи на соответствующий полигон
     */
    _initLabelCollectionListeners() {
        let controller = {
            onBeforeEventFiring: function (events, type, event) {
                if (event.get('target').options.get('pane') === 'phantom') {
                    return false;
                }

                let polygon = event.get('target').properties.get('labelPolygon');
                if (polygon) {
                    let newEvent = new Event({
                        target: polygon,
                        type: `label${type}`
                    }, event);
                    polygon.events.fire(`label${type}`, newEvent);
                }
                return false;
            }
        };
        let eventManager = new EventManager({
            controllers: [controller]
        });
        this._labelsCollection.events.setParent(eventManager);
    }

    _initMapListeners() {
        this.initMapListeners(() => {
            //TODO прятать подписи, чтобы не слипались
            this._clearVisibilityInLabelsState();
            this._calculatePolygonsCollection();
        });
    }

    _deleteLabelStateListeners() {
        this._polygonsCollection.each(polygon => {
            this._deleteLabelStateListener(polygon);
        });
    }

    /**
     * Удаляет слушатель на изменение состояния видимости подписи у полигона
     */
    _deleteLabelStateListener(polygon) {
        const monitor = this._getFromLabelState(polygon, 'labelMonitor');
        if (monitor) {
            monitor.removeAll();
        }
    }

    /**
     * Удаляет слушатели событий с коллекции полигонов
     */
    _deletePolygonCollectionListeners() {
        this._polygonsCollection.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
        this.destroyMapListeners();
    }

    _deletePolygonsListeners() {
        this._polygonsCollection.each((polygon) => {
            this._deletePolygonListener(polygon);
        });
    }

    /**
     * Удаляет слушатели событий с полигона
     */
    _deletePolygonListener(polygon) {
        polygon.events.remove(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
        polygon.events.remove('parentchange', this._onPolygonParentChangeHandler, this);
    }
}
