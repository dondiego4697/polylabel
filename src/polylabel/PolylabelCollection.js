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
        this._init();
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

    _init() {
        this._map.geoObjects.add(this._labelsCollection);
        this._firstCalculatePolygons().then(() => {
            this._initMapListeners();
            this._initPolygonCollectionListeners();
            this._initPolygonsListeners();
            this._initLabelCollectionListeners();
        });
    }

    _firstCalculatePolygons() {
        this._clearLabelCollection();
        this._polygonsCollection.each(polygon => {
            this._calculateNewPolygon(polygon).then(label => {
                this._analyzeAndSetLabelData(polygon, label);
            });
        });
        return Promise.resolve();
    }

    _calculatePolygons() {
        let promises = [];
        this._polygonsCollection.each(polygon => {
            if (polygon.geometry.getType() === 'Polygon') {
                const label = this._getFromLabelState(polygon, 'label');
                if (label) promises.push(this._analyzeAndSetLabelData(polygon, label));
            }
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
            const label = this._getFromLabelState(polygon, 'label');
            if (label) label.destroy();
        });
        this._clearLabelCollection();
    }

    /**
     * Рассчитывает данные для подписи полигона
     */
    _calculatePolygonLabelData(polygon, isLabelCreated) {
        const options = this.getOptions(polygon);
        const zoomRangeOptions = this.getZoomRangeOptions(polygon);

        const label = (isLabelCreated) ?
            this._getFromLabelState(polygon, 'label') :
            new Label(this._map, polygon, this._labelsCollection);
        label.createLabelData(options, zoomRangeOptions);

        return Promise.resolve(label);
    }

    /**
     * Анализирует данные о подписи полигона и устанавливает параметры подписи
     */
    _analyzeAndSetLabelData(polygon, label, visibleState) {
        return new Promise(resolve => {
            nextTick(() => {
                const data = label.setDataByZoom(this._map.getZoom(), visibleState);
                this._setCurrentConfiguredVisibility(polygon, data.currentConfiguredVisibileType);
                this._setCurrentVisibility(polygon, data.currentVisibleType);
                resolve();
            });
        });
    }

    /**
     * Устанавливает статус текущей видимости для полигона (автоматически рассчитанный)
     */
    _setCurrentConfiguredVisibility(polygon, type) {
        this._currentConfiguredVisibility.set(polygon, type);        
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
    _calculateNewPolygon(polygon) {
        return new Promise(resolve => {
            if (polygon.geometry.getType() === 'Polygon') {
                this._calculatePolygonLabelData(polygon).then(label => {
                    this._setInLabelState(polygon, 'label', label);
                    this._initLabelStateListener(polygon);
                    label.createPlacemarks();
                    label.addToCollection().then(() => {
                        resolve(label);
                    });                
                });
            }
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
        monitor.add('visible', newValue => {
            setTimeout(() => {
                if (this._dblClick) {
                    this._dblClick = false;
                    return;
                }
                this._analyzeAndSetLabelData(
                    polygon,
                    this._getFromLabelState(polygon, 'label'),
                    newValue
                );
            }, 100);
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
        if (polygon.geometry.getType() === 'Polygon') {            
            polygon.events.add(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
            polygon.events.add('parentchange', this._onPolygonParentChangeHandler, this);
        }
    }

    _onPolygonParentChangeHandler(event) {
        this._isPolygonParentChange.set(event.get('target'), 2);
        // 2 - это кол-во событий, которые слушаем ['optionschange', 'propertieschange']
        // Это необходимо, чтобы при удалении полигона в _onPolygonOptionsChangeHandler
        // не происходило присваивание опций пустой подписи,
        // тк при удалении объекта из коллекции у него меняются все опции
    }

    _onPolygonOptionsChangeHandler(event) {
        const polygon = event.get('target');
        let label = this._getFromLabelState(polygon, 'label');

        const curr = this._isPolygonParentChange.get(polygon);
        if (curr > 0 || !label) {
            this._isPolygonParentChange.set(event.get('target'), curr - 1);
            return;
        }

        label.setVisibilityForce('none');
        label.setLayoutTemplate();

        this._calculatePolygonLabelData(polygon, true).then(label => {
            this._setInLabelState(polygon, 'label', label);
            this._analyzeAndSetLabelData(polygon, label);
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
                const polygon = event.get('child');
                this._calculateNewPolygon(polygon).then(label => {
                    this._analyzeAndSetLabelData(polygon, label);                    
                });
                break;
            }
            case 'remove': {
                this._deleteLabelStateListener(event.get('child'));
                const label = this._getFromLabelState(event.get('child'), 'label');
                if (label) label.destroy();
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
                if (event.get('target').options.get('pane') === 'phantom') return false;

                let polygon = event.get('target').properties.get('polygon');
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
        this.initMapListeners((type) => {
            if (type === 'dblclick') {
                this._dblClick = true;                
            }
            if (type === 'boundschange') {
                this._clearVisibilityInLabelsState();
                this._calculatePolygons();
            }
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
