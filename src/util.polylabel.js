import createLabel from 'createLabel';
import setCenter from 'setCenter';
import createDefaultLabelData from 'createDefaultLabelData';
import setZoomVisibility from 'setZoomVisibility';

class Polylabel {
    /**
     * @param {Map} map - карта.
     * @param {GeoObjectCollection} collections - коллекция коллекций геообъектов.
     */
    constructor(map, collections) {
        this._map = map;
        this._collections = collections;
        this._labelsCollections = new ymaps.GeoObjectCollection();
        this._initData();
    }

    _initData() {
        this._initMapListeners();
        this._calculateCollections(true);
        this._initCollectionListeners();
    }

    _calculateCollections(isFirstCals) {
        if (isFirstCals) {
            this._labelsCollections.options.set({pane: 'phantom'});
            this._labelsCollections.removeAll();
            this._map.geoObjects.add(this._labelsCollections);
        }
        this._collections.each((collection) => {
            let labelCollection = new ymaps.GeoObjectCollection();
            this._labelsCollections.add(labelCollection);
            collection.each((geoObject) => {
                if (isFirstCals) {
                    this._calculateGeoObject(geoObject, labelCollection).then(() => {
                        this._analyseLabelData(geoObject);
                    });
                } else {
                    this._analyseLabelData(geoObject);
                }
            });
        });
    }

    _analyseLabelData(geoObject) {
        let {data: labelData, autoCenter, label} = geoObject.properties.get('labelData');
        labelData = labelData[this._map.getZoom()];

        if (labelData.visibleForce || labelData.visible) {
            label.geometry.setCoordinates(labelData.center || autoCenter);
            label.options.set({pane: 'places'});
        } else {
            label.options.set({pane: 'phantom'});
        }
    }

    _calculateGeoObject(geoObject, labelCollection) {
        return new Promise(resolve => {
            const options = this._getOptions(geoObject);
            const properties = this._getProperties(geoObject);
            let labelData = createDefaultLabelData();
            setCenter(labelData, geoObject, properties);
            const label = createLabel(options);
            labelCollection.add(label);
            label.getOverlay().then((overlay) => {
                overlay.getLayout().then(layout => {
                    const size = layout._element.firstChild.getBoundingClientRect();
                    label.properties.set({
                        top: -(size.height / 2),
                        left: -(size.width / 2)
                    });
                    setZoomVisibility(this._map, labelData, geoObject, size, options.labelForceVisibleZoom);
                    labelData.label = label;
                    geoObject.properties.set('labelData', labelData);
                    resolve();
                });
            });
        });
    }

    _getOptions(obj) {
        const mainOpts = ['labelForceVisibleZoom', 'labelTextClassName', 'labelHtml', 'labelText'];
        const options = obj.options;
        const result = {};
        mainOpts.forEach((key) => {
            result[key] = options.get(key, null);
        });
        return result;
    }

    _getProperties(obj) {
        const mainOpts = ['labelCenterCoords'];
        const properties = obj.properties;
        const result = {};
        mainOpts.forEach((key) => {
            result[key] = properties.get(key, null);
        });
        return result;
    }

    _initMapListeners() {
        this._map.events.add('boundschange', (event) => {
            if (event.get('newZoom') !== event.get('oldZoom')) {
                this._calculateCollections();
            }
        });
    }

    _initCollectionListeners() {
        this._collections.events.add(['add', 'remove'], (event) => {
            switch (event.get('type')) {
                case 'add': {}
                case 'remove': {
                    this._calculateCollections(true);
                    break;
                }
            }
        });
    }
}
export default Polylabel;
