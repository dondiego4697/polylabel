ymaps.modules.define('src.config', [], function (_provide) {
    _provide({
        MIN_ZOOM: 0,
        MAX_ZOOM: 19,
        options: ['labelLayout', 'labelDotLayout', 'labelClassName', 'labelForceVisible', 'labelTextColor', 'labelTextSize', 'labelCenterCoords', 'labelOffset'],
        properties: []
    });
});
//# sourceMappingURL=config.js.map

ymaps.modules.define('src.label.GeoObjectCollection.Label', ['util.extend', 'util.objectKeys', 'Placemark', 'src.label.util.LabelPlacemarkOverlay', 'src.label.util.createLabelLayoutTemplate', 'src.label.util.createDotLayoutTemplate', 'src.label.util.getLabelLayout'], function (_provide, _utilExtend, _utilObjectKeys, Placemark, LabelPlacemarkOverlay, createLabelLayoutTemplate, createDotLayoutTemplate, getLabelLayout) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var Label = function () {
        function Label(polygon, options, properties, parentCollection, layoutTemplateCache) {
            _classCallCheck(this, Label);

            if (!polygon || !parentCollection) {
                throw new Error('wrong argument');
            }
            this._polygon = polygon;
            this._parentCollection = parentCollection;
            this._placemark = {
                label: null,
                dot: null
            };
            this._layout = {
                label: null,
                dot: null
            };
            this._init(options, properties, layoutTemplateCache);
        }

        Label.prototype.getPlacemark = function getPlacemark() {
            return this._placemark;
        };

        Label.prototype.getLayout = function getLayout() {
            return this._layout;
        };

        Label.prototype.removeFromCollection = function removeFromCollection() {
            var _this = this;

            if (!this._parentCollection) {
                return;
            }
            ['label', 'dot'].forEach(function (type) {
                if (_this._parentCollection.indexOf(_this._placemark[type]) === -1) {
                    return;
                }
                _this._parentCollection.remove(_this._placemark[type]);
            });
        };

        Label.prototype.addToCollection = function addToCollection() {
            var _this2 = this;

            if (!this._parentCollection) {
                return Promise.reject();
            }
            var layouts = ['label', 'dot'].map(function (type) {
                if (!_this2._placemark[type].getParent()) {
                    _this2._parentCollection.add(_this2._placemark[type]);
                }
                return getLabelLayout(_this2._placemark[type]).then(function (layout) {
                    _this2._layout[type] = layout;
                });
            });
            return Promise.all(layouts);
        };

        Label.prototype._init = function _init(options, properties, layoutTemplateCache) {
            var _getLayoutTemplate2 = this._getLayoutTemplate(options, layoutTemplateCache),
                labelLayout = _getLayoutTemplate2.labelLayout,
                labelDotLayout = _getLayoutTemplate2.labelDotLayout;

            this._placemark.label = Label._createPlacemark({
                properties: {
                    '_labelPolygon': this._polygon
                },
                options: options
            }, labelLayout);

            this._placemark.dot = Label._createPlacemark({
                properties: {
                    '_labelPolygon': this._polygon
                }
            }, labelDotLayout);
        };

        Label.prototype._getLayoutTemplate = function _getLayoutTemplate(options, layoutTemplateCache) {
            var createTemplate = {
                labelLayout: createLabelLayoutTemplate,
                labelDotLayout: createDotLayoutTemplate
            };
            return ['labelLayout', 'labelDotLayout'].reduce(function (result, key) {
                var layoutTemplate = options[key];
                var layoutTemplateKey = !layoutTemplate ? 'default' + key : layoutTemplate;

                if (layoutTemplateCache[layoutTemplateKey]) {
                    result[key] = layoutTemplateCache[layoutTemplateKey];
                } else {
                    var template = createTemplate[key](layoutTemplate);
                    result[key] = template;
                    layoutTemplateCache[layoutTemplateKey] = template;
                }
                return result;
            }, {});
        };

        Label._createPlacemark = function _createPlacemark(params, layout) {
            var options = _utilExtend({}, {
                iconLayout: layout,
                iconLabelPosition: 'absolute',
                pointOverlay: LabelPlacemarkOverlay
            }, params.options);
            return new Placemark([0, 0], params.properties, options);
        };

        Label.prototype.setLayoutTemplate = function setLayoutTemplate(params) {
            var _this3 = this;

            var createLayoutTemplate = {
                label: createLabelLayoutTemplate,
                dot: createDotLayoutTemplate
            };

            return Promise.all(_utilObjectKeys(params).map(function (type) {
                var iconLayout = createLayoutTemplate[type](params[type]);
                if (_this3._placemark[type].getParent()) {
                    _this3._placemark[type].options.set({ iconLayout: iconLayout });
                }
                /* return getLabelLayout(this._placemark[type]).then(layout => {
                    this._layout[type] = layout;
                }); */
            }));
        };

        Label.prototype.setCoordinates = function setCoordinates(coords) {
            var _this4 = this;

            if (coords.toString() !== this._placemark.label.geometry.getCoordinates().toString()) {
                ['dot', 'label'].forEach(function (type) {
                    _this4._placemark[type].geometry.setCoordinates(coords);
                });
            }
        };

        Label.prototype.setVisibility = function setVisibility(visibleType) {
            var _this5 = this;

            _utilObjectKeys(this._placemark).forEach(function (type) {
                var pane = type === visibleType ? 'places' : 'phantom';
                _this5._placemark[type].options.set({ pane: pane });
            });
        };

        Label.prototype.setStyles = function setStyles(data) {
            this._placemark.label.options.set({
                iconLabelClassName: data.className,
                iconLabelTextSize: data.textSize,
                iconLabelTextColor: data.textColor
            });
        };

        Label.prototype.centerAndSetIconShape = function centerAndSetIconShape(type, size, offset) {
            var h = size.height / 2;
            var w = size.width / 2;

            this._placemark[type].options.set({
                iconShape: {
                    type: 'Rectangle',
                    coordinates: [[-w + offset[1], -h + offset[0]], [w + offset[1], h + offset[0]]]
                },
                iconLabelTop: -h + offset[0],
                iconLabelLeft: -w + offset[1]
            });
        };

        Label.prototype.destroy = function destroy() {
            this.removeFromCollection();
        };

        return Label;
    }();

    _provide(Label);
});
//# sourceMappingURL=Label.js.map

ymaps.modules.define('src.label.util.createDotLayoutTemplate', ['templateLayoutFactory'], function (_provide, templateLayoutFactory) {
    var defaultDotTemplate = '<div {% style %}background-color: red; width: 10px; height: 10px; border-radius: 50px;{% endstyle %}></div>';

    _provide(function (template) {
        if (typeof template === 'undefined') {
            template = defaultDotTemplate;
        }
        return templateLayoutFactory.createClass('\n    <div {% style %}position: {{options.labelPosition}}; top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>\n        ' + template + '\n    </div>');
    });
});
//# sourceMappingURL=createDotLayoutTemplate.js.map

ymaps.modules.define('src.label.util.createLabelLayoutTemplate', ['templateLayoutFactory'], function (_provide, templateLayoutFactory) {
    _provide(function (template) {
        return templateLayoutFactory.createClass('\n    <div {% style %}position: {{options.labelPosition}}; top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>\n        <div class="{{options.labelClassName}}"\n            {% style %}font-size: {{options.labelTextSize}}px; color: {{options.labelTextColor}}; {% endstyle %}>\n            ' + template + '\n        </div>\n    </div>');
    });
});
//# sourceMappingURL=createLabelLayoutTemplate.js.map

ymaps.modules.define("src.label.util.getLabelLayout", [], function (_provide) {
    _provide(function (label) {
        return label.getOverlay().then(function (overlay) {
            return overlay.getLayout();
        });
    });
});
//# sourceMappingURL=getLabelLayout.js.map

ymaps.modules.define("src.label.util.getLayoutSize", [], function (_provide) {
    _provide(function (layout) {
        var el = layout.getElement();

        var _el$children$0$getBou = el.children[0].getBoundingClientRect(),
            width = _el$children$0$getBou.width,
            height = _el$children$0$getBou.height;

        return { width: width, height: height };
    });
});
//# sourceMappingURL=getLayoutSize.js.map

ymaps.modules.define('src.label.util.LabelPlacemarkOverlay', ['util.defineClass', 'overlay.Placemark', 'option.Manager'], function (_provide, _utilDefineClass, overlayPlacemark, OptionManager) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    var LabelPlacemarkOverlay = function (_overlayPlacemark) {
        _utilDefineClass(LabelPlacemarkOverlay, _overlayPlacemark);

        function LabelPlacemarkOverlay(geometry, properties, options) {
            _classCallCheck(this, LabelPlacemarkOverlay);

            return _possibleConstructorReturn(this, _overlayPlacemark.call(this, geometry, properties, options));
        }

        LabelPlacemarkOverlay.prototype.getData = function getData() {
            var polygon = this._data.geoObject.properties.get('_labelPolygon');
            return {
                geoObject: polygon,
                geometry: polygon.geometry,
                properties: polygon.properties,
                //options: polygon.options, TODO невозможно переопределить опции, потому что https://github.yandex-team.ru/mapsapi/jsapi-v2/blob/master/src/overlay/view/abstract/baseWithLayout/overlay.view.BaseWithLayout.js#L99
                state: polygon.state
            };
        };

        return LabelPlacemarkOverlay;
    }(overlayPlacemark);

    _provide(LabelPlacemarkOverlay);
});
//# sourceMappingURL=LabelPlacemarkOverlay.js.map

ymaps.modules.define('src.polylabel.PolylabelBased', ['src.config', 'GeoObject'], function (_provide, CONFIG, GeoObject) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var PolylabelBased = function () {
        function PolylabelBased(map) {
            _classCallCheck(this, PolylabelBased);

            this._map = map;
        }

        PolylabelBased.prototype.initMapListeners = function initMapListeners(callback) {
            this._mapBoundsChangeCallback = callback;
            this._map.events.add('boundschange', this._mapBoundsChangeHandler, this);
        };

        PolylabelBased.prototype.destroyMapListeners = function destroyMapListeners() {
            this._map.events.remove('boundschange', this._mapBoundsChangeHandler, this);
        };

        PolylabelBased.prototype._mapBoundsChangeHandler = function _mapBoundsChangeHandler(event) {
            if (event.get('newZoom') !== event.get('oldZoom')) {
                this._mapBoundsChangeCallback();
            }
        };

        PolylabelBased.prototype.getOptions = function getOptions(obj) {
            return CONFIG.options.reduce(function (result, key) {
                result[key] = obj instanceof GeoObject ? obj.options.get(key) : obj.options[key];
                return result;
            }, {});
        };

        PolylabelBased.prototype.getProperties = function getProperties(obj) {
            return CONFIG.properties.reduce(function (result, key) {
                result[key] = obj instanceof GeoObject ? obj.properties.get(key) : obj.properties[key];
                return result;
            }, {});
        };

        return PolylabelBased;
    }();

    _provide(PolylabelBased);
});
//# sourceMappingURL=PolylabelBased.js.map

ymaps.modules.define('src.polylabel.PolylabelCollection', ['util.defineClass', 'util.objectKeys', 'src.polylabel.PolylabelBased', 'src.label.GeoObjectCollection.Label', 'src.util.center.setCenter', 'src.util.style.setOffset', 'src.util.zoom.setZoomVisibilityForGeoObject', 'src.util.zoom.setForceVisibleZoom', 'src.util.zoom.parseZoomData', 'src.util.createDefaultLabelData', 'GeoObjectCollection', 'Monitor', 'system.nextTick', 'data.Manager', 'event.Manager', 'Event'], function (_provide, _utilDefineClass, _utilObjectKeys, PBased, Label, setCenter, setOffset, setZoomVisibilityForGeoObject, setForceVisibleZoom, parseZoomData, createDefaultLabelData, GeoObjectCollection, Monitor, nextTick, DataManager, EventManager, Event) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    function _possibleConstructorReturn(self, call) {
        if (!self) {
            throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
        }

        return call && (typeof call === "object" || typeof call === "function") ? call : self;
    }

    var PolylabelCollection = function (_PBased) {
        _utilDefineClass(PolylabelCollection, _PBased);

        function PolylabelCollection(map, polygonsCollection) {
            _classCallCheck(this, PolylabelCollection);

            var _this = _possibleConstructorReturn(this, _PBased.call(this, map));

            _this._map = map;
            _this._labelsCollection = new GeoObjectCollection();
            _this._labelsState = new WeakMap();
            _this._polygonsCollection = polygonsCollection;
            _this._currentConfiguredVisibility = new WeakMap();
            _this._currentVisibility = new WeakMap();
            _this._layoutTemplateCache = {};
            _this._initData();
            return _this;
        }

        PolylabelCollection.prototype.destroy = function destroy() {
            this._deleteLabelStateListeners();
            this._deletePolygonsListeners();
            this._deletePolygonCollectionListeners();
            this._deleteLabelCollection();
            this._map.geoObjects.remove(this._labelsCollection);
        };

        PolylabelCollection.prototype.getLabelState = function getLabelState(polygon) {
            return this._labelsState.get(polygon);
        };

        PolylabelCollection.prototype.getConfiguredVisibility = function getConfiguredVisibility(polygon) {
            return this._currentConfiguredVisibility.get(polygon);
        };

        PolylabelCollection.prototype.getCurrentVisibility = function getCurrentVisibility(polygon) {
            return this._currentVisibility.get(polygon);
        };

        PolylabelCollection.prototype._initData = function _initData() {
            var _this2 = this;

            this._map.geoObjects.add(this._labelsCollection);
            this._firstCalculatePolygonsCollection().then(function () {
                _this2._initMapListeners();
                _this2._initPolygonCollectionListeners();
                _this2._initPolygonsListeners();
                _this2._initLabelCollectionListeners();
            });
        };

        PolylabelCollection.prototype._firstCalculatePolygonsCollection = function _firstCalculatePolygonsCollection() {
            var _this3 = this;

            this._clearLabelCollection();
            var promises = [];
            this._polygonsCollection.each(function (polygon) {
                _this3._setLabelState(polygon, 'visible', undefined);
                _this3._initLabelStateListener(polygon);
                _this3._calculatePolygonLabelData(polygon).then(function (labelData) {
                    _this3._setLabelState(polygon, '_labelData', labelData);
                    promises.push(_this3._analyzeAndSetLabelData(_this3._map, polygon, _this3._getLabelState(polygon, '_labelData')));
                });
            });
            return Promise.all(promises);
        };

        PolylabelCollection.prototype._calculatePolygonsCollection = function _calculatePolygonsCollection() {
            var _this4 = this;

            var promises = [];
            this._polygonsCollection.each(function (polygon) {
                promises.push(_this4._analyzeAndSetLabelData(_this4._map, polygon, _this4._getLabelState(polygon, '_labelData')));
            });
            return Promise.all(promises);
        };

        PolylabelCollection.prototype._clearLabelCollection = function _clearLabelCollection() {
            this._labelsCollection.removeAll();
            this._labelsCollection.options.set({
                pane: 'phantom'
            });
        };

        PolylabelCollection.prototype._deleteLabelCollection = function _deleteLabelCollection() {
            var _this5 = this;

            this._polygonsCollection.each(function (polygon) {
                _this5._getLabelState(polygon, '_labelData').label.destroy();
            });
            this._clearLabelCollection();
        };

        PolylabelCollection.prototype._calculatePolygonLabelData = function _calculatePolygonLabelData(polygon, isLabelInstCreated) {
            var _this6 = this;

            var options = this.getOptions(polygon);
            var properties = this.getProperties(polygon);
            var labelData = createDefaultLabelData();
            setForceVisibleZoom(labelData, options.labelForceVisible);
            var coordinates = polygon.geometry.getCoordinates();
            setCenter(labelData, coordinates, options.labelCenterCoords);
            setOffset(labelData, options.labelOffset);

            var labelInst = void 0;
            if (isLabelInstCreated) {
                labelInst = this._getLabelState(polygon, '_labelData').label;
            } else {
                labelInst = new Label(polygon, options, properties, this._labelsCollection, this._layoutTemplateCache);
            }
            labelData.label = labelInst;

            return labelInst.addToCollection().then(function () {
                var labelClassName = options.labelClassName,
                    labelTextColor = options.labelTextColor,
                    labelTextSize = options.labelTextSize;

                labelClassName = parseZoomData(labelClassName);
                labelTextSize = parseZoomData(labelTextSize);
                labelTextColor = parseZoomData(labelTextColor);

                _utilObjectKeys(labelData.zoomInfo).forEach(function (z) {
                    labelData.zoomInfo[z].style = {
                        className: labelClassName ? labelClassName[z] : '',
                        textSize: labelTextSize ? labelTextSize[z] : '',
                        textColor: labelTextColor ? labelTextColor[z] : ''
                    };
                });
            }).then(function () {
                return setZoomVisibilityForGeoObject(_this6._map, labelData, coordinates[labelData.polygonIndex], labelInst);
            }).then(function () {
                return labelData;
            });
        };

        PolylabelCollection.prototype._analyzeAndSetLabelData = function _analyzeAndSetLabelData(map, polygon, labelData, visibleState) {
            if (!labelData) {
                return Promise.resolve();
            }
            //TODO наверное стоит завернуть установку всех параметров в Label
            var zoomInfo = labelData.zoomInfo,
                autoCenter = labelData.autoCenter,
                label = labelData.label;

            zoomInfo = zoomInfo[map.getZoom()];
            this._setCurrentConfiguredVisibility(polygon, zoomInfo.visible, zoomInfo.visibleForce);
            label.setCoordinates(zoomInfo.center || autoCenter);
            visibleState = visibleState ? visibleState : zoomInfo.visibleForce;
            var visibleType = visibleState === 'auto' ? zoomInfo.visible : visibleState;
            this._setCurrentVisibility(polygon, visibleType);
            label.setVisibility(visibleType);
            if (['dot', 'label'].includes(visibleType)) {
                label.centerAndSetIconShape(visibleType, visibleType === 'dot' ? labelData.dotSize : zoomInfo.labelSize, zoomInfo.labelOffset);
            }
            label.setStyles(zoomInfo.style);
            return Promise.resolve();
        };

        PolylabelCollection.prototype._setCurrentConfiguredVisibility = function _setCurrentConfiguredVisibility(polygon, visible, visibleForce) {
            var result = visibleForce && ['dot', 'label', 'none'].indexOf(visibleForce) !== -1 ? visibleForce : visible;
            this._currentConfiguredVisibility.set(polygon, result);
        };

        PolylabelCollection.prototype._setCurrentVisibility = function _setCurrentVisibility(polygon, type) {
            this._currentVisibility.set(polygon, ['dot', 'label'].indexOf(type) !== -1 ? type : 'none');
        };

        PolylabelCollection.prototype._recalculateNewPolygon = function _recalculateNewPolygon(polygon) {
            var _this7 = this;

            this._calculatePolygonLabelData(polygon).then(function (labelData) {
                _this7._setLabelState(polygon, '_labelData', labelData);
                _this7._analyzeAndSetLabelData(_this7._map, polygon, _this7._getLabelState(polygon, '_labelData'));
            });
        };

        PolylabelCollection.prototype._setLabelState = function _setLabelState(polygon, key, value) {
            var labelState = this._labelsState.get(polygon);
            if (!labelState) {
                labelState = new DataManager();
                this._labelsState.set(polygon, labelState);
            }
            labelState.set(key, value);
        };

        PolylabelCollection.prototype._getLabelState = function _getLabelState(polygon, key) {
            var labelState = this._labelsState.get(polygon);
            if (labelState) {
                return labelState.get(key);
            }
        };

        PolylabelCollection.prototype._clearVisibilityInLabelsState = function _clearVisibilityInLabelsState() {
            var _this8 = this;

            this._polygonsCollection.each(function (polygon) {
                _this8._setLabelState(polygon, 'visible', undefined);
            });
        };

        PolylabelCollection.prototype._polygonCollectionEventHandler = function _polygonCollectionEventHandler(event) {
            switch (event.get('type')) {
                case 'add':
                    this._recalculateNewPolygon(event.get('child'));
                    break;
                case 'remove':
                    var labelData = this._getLabelState(event.get('child'), '_labelData');
                    if (labelData) {
                        labelData.label.destroy();
                    }
                    break;
            }
        };

        PolylabelCollection.prototype._deleteLabelStateListeners = function _deleteLabelStateListeners() {
            var _this9 = this;

            this._polygonsCollection.each(function (polygon) {
                _this9._deleteLabelStateListener(polygon);
            });
        };

        PolylabelCollection.prototype._deleteLabelStateListener = function _deleteLabelStateListener(polygon) {
            var monitor = this._getLabelState(polygon, 'labelMonitor');
            if (monitor) {
                monitor.removeAll();
            }
        };

        PolylabelCollection.prototype._initLabelStateListener = function _initLabelStateListener(polygon) {
            var _this10 = this;

            var monitor = new Monitor(this._labelsState.get(polygon));
            this._setLabelState(polygon, 'labelMonitor', monitor);
            monitor.add('visible', function (newValue) {
                _this10._analyzeAndSetLabelData(_this10._map, polygon, _this10._getLabelState(polygon, '_labelData'), newValue);
            });
        };

        PolylabelCollection.prototype._initPolygonsListeners = function _initPolygonsListeners() {
            var _this11 = this;

            this._polygonsCollection.each(function (polygon) {
                _this11._initPolygonListener(polygon);
            });
        };

        PolylabelCollection.prototype._initPolygonListener = function _initPolygonListener(polygon) {
            polygon.events.add(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
            polygon.events.add('parentchange', this._onPolygonParentChangeHandler, this);
        };

        PolylabelCollection.prototype._onPolygonParentChangeHandler = function _onPolygonParentChangeHandler(event) {
            this._isPolygonParentChange = true;
        };

        PolylabelCollection.prototype._onPolygonOptionsChangeHandler = function _onPolygonOptionsChangeHandler(event) {
            var _this12 = this;

            nextTick(function () {
                var polygon = event.get('target');
                var labelData = _this12._getLabelState(polygon, '_labelData');
                if (_this12._isPolygonParentChange || !labelData) {
                    _this12._isPolygonParentChange = false;
                    return;
                }
                labelData.label.setVisibility('phantom');
                labelData.label.setLayoutTemplate({
                    label: polygon.options.get('labelLayout'),
                    dot: polygon.options.get('labelDotLayout')
                }).then(function () {
                    return _this12._calculatePolygonLabelData(polygon, true);
                }).then(function (labelData) {
                    _this12._setLabelState(polygon, '_labelData', labelData);
                    _this12._analyzeAndSetLabelData(_this12._map, polygon, _this12._getLabelState(polygon, '_labelData'));
                });
            });
        };

        PolylabelCollection.prototype._initPolygonCollectionListeners = function _initPolygonCollectionListeners() {
            this._polygonsCollection.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
        };

        PolylabelCollection.prototype._initLabelCollectionListeners = function _initLabelCollectionListeners() {
            var controller = {
                onBeforeEventFiring: function onBeforeEventFiring(events, type, event) {
                    if (event.get('target').options.get('pane') === 'phantom') {
                        return false;
                    }
                    var polygon = event.get('target').properties.get('_labelPolygon');
                    if (polygon) {
                        var newEvent = new Event({
                            target: polygon,
                            type: 'label' + type
                        }, event);
                        polygon.events.fire('label' + type, newEvent);
                    }
                    return false;
                }
            };
            var eventManager = new EventManager({
                controllers: [controller]
            });
            this._labelsCollection.events.setParent(eventManager);
        };

        PolylabelCollection.prototype._initMapListeners = function _initMapListeners() {
            var _this13 = this;

            this.initMapListeners(function () {
                _this13._clearVisibilityInLabelsState();
                _this13._calculatePolygonsCollection();
            });
        };

        PolylabelCollection.prototype._deletePolygonCollectionListeners = function _deletePolygonCollectionListeners() {
            this._polygonsCollection.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
            this.destroyMapListeners();
        };

        PolylabelCollection.prototype._deletePolygonsListeners = function _deletePolygonsListeners() {
            var _this14 = this;

            this._polygonsCollection.each(function (polygon) {
                _this14._deletePolygonListener(polygon);
            });
        };

        PolylabelCollection.prototype._deletePolygonListener = function _deletePolygonListener(polygon) {
            polygon.events.remove(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
            polygon.events.remove('parentchange', this._onPolygonParentChangeHandler, this);
        };

        return PolylabelCollection;
    }(PBased);

    _provide(PolylabelCollection);
});
//# sourceMappingURL=PolylabelCollection.js.map

ymaps.modules.define("src.polylabel.PolylabelObjectManager", [], function (_provide) {
  _provide(function () {});
});
//# sourceMappingURL=PolylabelObjectManager.js.map

ymaps.modules.define('util.createPolylabel', ['src.polylabel.PolylabelCollection', 'src.polylabel.PolylabelObjectManager', 'ObjectManager'], function (_provide, PCollection, PObjectManager, ObjectManager) {
  _provide(function (map, data) {
    return data instanceof ObjectManager ? new PObjectManager(map, data) : new PCollection(map, data);;
  });
});
//# sourceMappingURL=util.createPolylabel.js.map

ymaps.modules.define('src.util.center.setCenter', ['util.array', 'util.objectKeys', 'src.util.getPolesOfInaccessibility', 'src.util.zoom.parseZoomData'], function (_provide, _utilArray, _utilObjectKeys, getPolylabelCenter, parseZoomData) {
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    /**
     * Set centers for each zoom;
     * @param {Object} target - Target object containing each zoom in properties.
     * @param {Array} coordinates
     * @param {Object} properties
     * @param {Array | Object} labelCenterCoords - Center data.
     * May be one point(Array) or for certains zooms(Object).
     */
    function setCenter(target, coordinates, labelCenterCoords) {
        var autoCenterData = getPolylabelCenter(coordinates, 1.0);
        target.autoCenter = autoCenterData.center;
        target.polygonIndex = autoCenterData.index;

        if (_utilArray.isArray(labelCenterCoords)) {
            _utilObjectKeys(target.zoomInfo).forEach(function (z) {
                target.zoomInfo[z].center = labelCenterCoords;
            });
        } else if (labelCenterCoords && (typeof labelCenterCoords === 'undefined' ? 'undefined' : _typeof(labelCenterCoords)) === 'object') {
            var data = parseZoomData(labelCenterCoords);
            _utilObjectKeys(data).forEach(function (z) {
                if (typeof data[z] !== 'undefined') {
                    target.zoomInfo[z].center = data[z];
                }
            });
        }
    }

    _provide(setCenter)
});
//# sourceMappingURL=setCenter.js.map

ymaps.modules.define('src.util.checkPointPosition', [], function (_provide) {
    _provide(isInside);

    /**
         * Check if the point is inside geometry.
         * @param {Array[2]} point - Point coordinates.
         * @param {Array} coords - Geometry coordinates.
         */
    function isInside(point, coords) {
        var parity = 0;
        for (var i = 0; i < coords.length - 1; i++) {
            var e = [coords[i], coords[i + 1]];
            switch (edgeType(point, e)) {
                case 'TOUCHING':
                    return 'BOUNDARY';
                case 'CROSSING':
                    parity = 1 - parity;
            }
        }
        return parity ? 'INSIDE' : 'OUTSIDE';
    }

    /**
     * Determines the position of the point relative to the edge.
     * @param {Array[2]} p - Main point.
     * @param {Array[2]} p0 - First edge point.
     * @param {Array[2]} p1 - Second edge point.
     */
    function pointClassify(p, p0, p1) {
        var a = pointMinus(p1, p0);
        var b = pointMinus(p, p0);
        var sa = a[0] * b[1] - b[0] * a[1];
        if (sa > 0) {
            return 'LEFT';
        }
        if (sa < 0) {
            return 'RIGHT';
        }
        if (a[0] * b[0] < 0 || a[1] * b[1] < 0) {
            return 'BEHIND';
        }
        if (pointLength(a) < pointLength(b)) {
            return 'BEYOND';
        }
        if (pointEquals(p0, p)) {
            return 'ORIGIN';
        }
        if (pointEquals(p1, p)) {
            return 'DESTINATION';
        }
        return 'BETWEEN';
    }

    function pointMinus(p1, p2) {
        return [p1[0] - p2[0], p1[1] - p2[1]];
    }

    function pointLength(p) {
        return Math.sqrt(Math.pow(p[0], 2) + Math.pow(p[1], 2));
    }

    function pointEquals(p1, p2) {
        return p1[0] === p2[0] && p1[1] === p2[1];
    }

    /**
     * Determines how a ray from a point interacts with an edge (Crosses, Affects, Neutral).
     * @param {Arrya[2]} point - Main point.
     * @param {Array} edge - Edge.
     */
    function edgeType(point, edge) {
        var v = edge[0];
        var w = edge[1];
        switch (pointClassify(point, v, w)) {
            case 'LEFT':
                {
                    return v[1] < point[1] && point[1] <= w[1] ? 'CROSSING' : 'INESSENTIAL';
                }
            case 'RIGHT':
                {
                    return w[1] < point[1] && point[1] <= v[1] ? 'CROSSING' : 'INESSENTIAL';
                }
            case 'BETWEEN':
            case 'ORIGIN':
            case 'DESTINATION':
                return 'TOUCHING';
            default:
                {
                    return 'INESSENTIAL';
                }
        }
    }
});
//# sourceMappingURL=checkPointPosition.js.map

ymaps.modules.define('src.util.createDefaultLabelData', ['src.config'], function (_provide, CONFIG) {
    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;

    _provide(function () {
        var result = {
            zoomInfo: {}, // Object with info for every zoom
            autoCenter: [0, 0],
            polygonIndex: 0,
            dotSize: {
                height: 0,
                width: 0
            }
        };
        for (var i = MIN_ZOOM; i <= MAX_ZOOM; i++) {
            result.zoomInfo[i] = {
                visible: 'none', // label | dot | none
                visibleForce: 'auto', // label | dot | none | auto
                center: undefined,
                style: {
                    className: undefined,
                    textSize: undefined,
                    textColor: undefined
                },
                labelSize: {
                    height: 0,
                    width: 0
                },
                labelOffset: [0, 0]
            };
        }
        return result;
    });
});
//# sourceMappingURL=createDefaultLabelData.js.map

ymaps.modules.define('src.util.getPolesOfInaccessibility', ['util.calculateArea'], function (_provide, calculateArea) {
    _provide(getPolylabelCenter);

    function TinyQueue(data, compare) {
        if (!(this instanceof TinyQueue)) return new TinyQueue(data, compare);

        this.data = data || [];
        this.length = this.data.length;
        this.compare = compare || defaultCompare;

        if (this.length > 0) {
            for (var i = this.length >> 1; i >= 0; i--) {
                this._down(i);
            }
        }
    }

    function defaultCompare(a, b) {
        return a < b ? -1 : a > b ? 1 : 0;
    }

    TinyQueue.prototype = {

        push: function push(item) {
            this.data.push(item);
            this.length++;
            this._up(this.length - 1);
        },

        pop: function pop() {
            if (this.length === 0) return undefined;

            var top = this.data[0];
            this.length--;

            if (this.length > 0) {
                this.data[0] = this.data[this.length];
                this._down(0);
            }
            this.data.pop();

            return top;
        },

        peek: function peek() {
            return this.data[0];
        },

        _up: function _up(pos) {
            var data = this.data;
            var compare = this.compare;
            var item = data[pos];

            while (pos > 0) {
                var parent = pos - 1 >> 1;
                var current = data[parent];
                if (compare(item, current) >= 0) break;
                data[pos] = current;
                pos = parent;
            }

            data[pos] = item;
        },

        _down: function _down(pos) {
            var data = this.data;
            var compare = this.compare;
            var halfLength = this.length >> 1;
            var item = data[pos];

            while (pos < halfLength) {
                var left = (pos << 1) + 1;
                var right = left + 1;
                var best = data[left];

                if (right < this.length && compare(data[right], best) < 0) {
                    left = right;
                    best = data[right];
                }
                if (compare(best, item) >= 0) break;

                data[pos] = best;
                pos = left;
            }

            data[pos] = item;
        }
    };

    var Queue = TinyQueue;

    function getPolesOfInaccessibility(polygon, precision, debug) {
        precision = precision || 1.0;

        // find the bounding box of the outer ring
        var minX;
        var minY;
        var maxX;
        var maxY;

        for (var i = 0; i < polygon[0].length; i++) {
            var p = polygon[0][i];
            if (!i || p[0] < minX) minX = p[0];
            if (!i || p[1] < minY) minY = p[1];
            if (!i || p[0] > maxX) maxX = p[0];
            if (!i || p[1] > maxY) maxY = p[1];
        }

        var width = maxX - minX;
        var height = maxY - minY;
        var cellSize = Math.min(width, height);
        var h = cellSize / 2;

        // a priority queue of cells in order of their "potential" (max distance to polygon)
        var cellQueue = new Queue(null, compareMax);

        if (cellSize === 0) return [minX, minY];

        // cover polygon with initial cells
        for (var x = minX; x < maxX; x += cellSize) {
            for (var y = minY; y < maxY; y += cellSize) {
                cellQueue.push(new Cell(x + h, y + h, h, polygon));
            }
        }

        // take centroid as the first best guess
        var bestCell = getCentroidCell(polygon);

        // special case for rectangular polygons
        var bboxCell = new Cell(minX + width / 2, minY + height / 2, 0, polygon);
        if (bboxCell.d > bestCell.d) bestCell = bboxCell;

        var numProbes = cellQueue.length;

        while (cellQueue.length) {
            // pick the most promising cell from the queue
            var cell = cellQueue.pop();

            // update the best cell if we found a better one
            if (cell.d > bestCell.d) {
                bestCell = cell;
                if (debug) console.error('found best %d after %d probes', Math.round(1e4 * cell.d) / 1e4, numProbes);
            }

            // do not drill down further if there's no chance of a better solution
            if (cell.max - bestCell.d <= precision) continue;

            // split the cell into four cells
            h = cell.h / 2;
            cellQueue.push(new Cell(cell.x - h, cell.y - h, h, polygon));
            cellQueue.push(new Cell(cell.x + h, cell.y - h, h, polygon));
            cellQueue.push(new Cell(cell.x - h, cell.y + h, h, polygon));
            cellQueue.push(new Cell(cell.x + h, cell.y + h, h, polygon));
            numProbes += 4;
        }

        if (debug) {
            console.error('num probes: ' + numProbes);
            console.error('best distance: ' + bestCell.d);
        }

        return [bestCell.x, bestCell.y];
    }

    function compareMax(a, b) {
        return b.max - a.max;
    }

    function Cell(x, y, h, polygon) {
        this.x = x; // cell center x
        this.y = y; // cell center y
        this.h = h; // half the cell size
        this.d = pointToPolygonDist(x, y, polygon); // distance from cell center to polygon
        this.max = this.d + this.h * Math.SQRT2; // max distance to polygon within a cell
    }

    // signed distance from point to polygon outline (negative if point is outside)
    function pointToPolygonDist(x, y, polygon) {
        var inside = false;
        var minDistSq = Infinity;

        for (var k = 0; k < polygon.length; k++) {
            var ring = polygon[k];

            for (var i = 0, len = ring.length, j = len - 1; i < len; j = i++) {
                var a = ring[i];
                var b = ring[j];

                if (a[1] > y !== b[1] > y && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) inside = !inside;

                minDistSq = Math.min(minDistSq, getSegDistSq(x, y, a, b));
            }
        }

        return (inside ? 1 : -1) * Math.sqrt(minDistSq);
    }

    // get polygon centroid
    function getCentroidCell(polygon) {
        var area = 0;
        var x = 0;
        var y = 0;
        var points = polygon[0];

        for (var i = 0, len = points.length, j = len - 1; i < len; j = i++) {
            var a = points[i];
            var b = points[j];
            var f = a[0] * b[1] - b[0] * a[1];
            x += (a[0] + b[0]) * f;
            y += (a[1] + b[1]) * f;
            area += f * 3;
        }
        if (area === 0) return new Cell(points[0][0], points[0][1], 0, polygon);
        return new Cell(x / area, y / area, 0, polygon);
    }

    // get squared distance from a point to a segment
    function getSegDistSq(px, py, a, b) {
        var x = a[0];
        var y = a[1];
        var dx = b[0] - x;
        var dy = b[1] - y;

        if (dx !== 0 || dy !== 0) {
            var t = ((px - x) * dx + (py - y) * dy) / (dx * dx + dy * dy);

            if (t > 1) {
                x = b[0];
                y = b[1];
            } else if (t > 0) {
                x += dx * t;
                y += dy * t;
            }
        }

        dx = px - x;
        dy = py - y;

        return dx * dx + dy * dy;
    }

    /**
     * Returns the optimal center from the polygon and the index of the largest.
     * @param {Array} polygonCoords - Polygon geometry.
     * @param {number} precision
     * @param {boolean} debug
     */
    function getPolylabelCenter(polygonCoords, precision, debug) {
        if (typeof calculateArea === 'undefined') {
            throw new Error('Didn\'t find calculateArea module');
        }
        var maxArea = Number.MIN_VALUE;
        var indexOfMaxArea = 0;
        var data = void 0;
        if (polygonCoords.length > 1) {
            for (var i = 0; i < polygonCoords.length; i++) {
                var polygon = new ymaps.GeoObject({
                    geometry: {
                        type: 'Polygon', coordinates: [polygonCoords[i]]
                    }
                });
                var area = Math.round(calculateArea(polygon));
                if (maxArea < area) {
                    maxArea = area;
                    indexOfMaxArea = i;
                }
            }
            data = [polygonCoords[indexOfMaxArea]];
        } else {
            data = polygonCoords;
        }
        return {
            center: getPolesOfInaccessibility(data, precision, debug),
            index: indexOfMaxArea
        };
    }
});
//# sourceMappingURL=getPolesOfInaccessibility.js.map

ymaps.modules.define('src.util.stringReplacer', [], function (_provide) {
    _provide(function (template, argsArr) {
        var result = template;
        argsArr.forEach(function (item, i) {
            result = result.replace(new RegExp('\\$' + (i + 1), 'g'), item);
        });
        return result;
    });
});
//# sourceMappingURL=stringReplacer.js.map

ymaps.modules.define('src.util.style.setOffset', ['util.array', 'util.objectKeys', 'src.util.zoom.parseZoomData'], function (_provide, _utilArray, _utilObjectKeys, parseZoomData) {
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    function setOffset(target, labelOffset) {
        if (_utilArray.isArray(labelOffset)) {
            _utilObjectKeys(target.zoomInfo).forEach(function (z) {
                target.zoomInfo[z].labelOffset = labelOffset;
            });
        } else if (labelOffset && (typeof labelOffset === 'undefined' ? 'undefined' : _typeof(labelOffset)) === 'object') {
            var data = parseZoomData(labelOffset);
            _utilObjectKeys(data).forEach(function (z) {
                if (typeof data[z] !== 'undefined') {
                    target.zoomInfo[z].labelOffset = data[z];
                }
            });
        }
    }

    _provide(setOffset)
});
//# sourceMappingURL=setOffset.js.map

ymaps.modules.define('src.util.zoom.getFirstZoomInside', ['src.util.checkPointPosition', 'src.config'], function (_provide, isInside, CONFIG) {
    _provide(function (map, center, coords, size, offset) {
        var i = CONFIG.MIN_ZOOM,
            j = CONFIG.MAX_ZOOM;

        var zoom = void 0;
        while (i < j) {
            zoom = Math.floor((i + j) / 2);
            var elemPoints = getElemPoints(map, center, zoom, size, offset || [0, 0]);
            if (checkIsInside(map, coords, elemPoints, zoom)) {
                j = zoom;
            } else {
                i = zoom + 1;
            }
        }
        return i;
    });

    function getElemPoints(map, center, zoom, size, offset) {
        var centerProj = map.options.get('projection').toGlobalPixels(center, zoom);
        var w = size.width,
            h = size.height;

        h += offset[0];
        w += offset[1];
        var elemPoints = [];
        elemPoints.push([centerProj[0] - w / 2, centerProj[1] - h / 2], [centerProj[0] - w / 2, centerProj[1] + h / 2], [centerProj[0] + w / 2, centerProj[1] - h / 2], [centerProj[0] + w / 2, centerProj[1] + h / 2]);
        return elemPoints;
    }

    function checkIsInside(map, coords, elemPoints, zoom) {
        for (var i = 0; i < elemPoints.length; i++) {
            var point = map.options.get('projection').fromGlobalPixels(elemPoints[i], zoom);
            if (isInside(point, coords) !== 'INSIDE') {
                return false;
            }
        }
        return true;
    }
});
//# sourceMappingURL=getFirstZoomInside.js.map

ymaps.modules.define('src.util.zoom.parseZoomData', ['util.objectKeys', 'src.config'], function (_provide, _utilObjectKeys, CONFIG) {
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
        return typeof obj;
    } : function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };

    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;


    /**
     * Parse data about zoom.
     * @param {Object|primitive} zoomData
     * Supported object properties view: number, string
     * @return {Object} - Returned object with zoom, where the parsed values.
     * @example
     * zoomData = {1: 'value1', '3_5': 'value2'}
     * return {1: 'value1', 2: undefined ... 3: 'value2', 4: 'value2', 5: 'value2', 6: undefined ...}
     * zoomData = 'value123'
     * return {1: 'value123' ... 19: 'value123'}
    */
    function parseZoomData(zoomData) {
        var valid = ['number', 'string', 'boolean'];
        if (Object.prototype.toString.call(zoomData) === '[object Object]') {
            return _utilObjectKeys(zoomData).reduce(function (result, key) {
                if (typeof key === 'string') {
                    parseString(result, key, zoomData[key]);
                } else if (typeof key === 'number') {
                    parseNumber(result, key, zoomData[key]);
                }
                return result;
            }, createDefZoomObj());
        } else if (valid.includes(typeof zoomData === 'undefined' ? 'undefined' : _typeof(zoomData))) {
            return createDefZoomObj(zoomData);
        }
    }

    _provide(parseZoomData)

    function parseNumber(target, zoom, value) {
        target[zoom] = value;
    }

    function parseString(target, zoom, value) {
        if (!isNaN(Number(zoom))) {
            target[Number(zoom)] = value;
            return;
        }
        var zoomRange = zoom.split('_').map(Number);
        if (isNaN(zoomRange[0]) || isNaN(zoomRange[1])) {
            return;
        }
        var bottom = zoomRange[0] < MIN_ZOOM ? MIN_ZOOM : zoomRange[0];
        var top = zoomRange[1] > MAX_ZOOM ? MAX_ZOOM : zoomRange[1];
        while (bottom <= top) {
            target[bottom] = value;
            bottom++;
        }
    }

    function createDefZoomObj(val) {
        var i = MIN_ZOOM;
        var result = {};
        while (i <= MAX_ZOOM) {
            result[i] = val;
            i++;
        }
        return result;
    }
});
//# sourceMappingURL=parseZoomData.js.map

ymaps.modules.define('src.util.zoom.setForceVisibleZoom', ['util.objectKeys', 'src.util.zoom.parseZoomData'], function (_provide, _utilObjectKeys, parseZoomData) {
    function setForceVisibleZoom(target, labelForceVisibleZoom) {
        if (typeof labelForceVisibleZoom === 'string') {
            _utilObjectKeys(target.zoomInfo).forEach(function (z) {
                target.zoomInfo[z].visibleForce = labelForceVisibleZoom;
            });
        } else if (Object.prototype.toString.call(labelForceVisibleZoom) === '[object Object]') {
            var data = parseZoomData(labelForceVisibleZoom);
            _utilObjectKeys(data).forEach(function (z) {
                if (typeof data[z] !== 'undefined') {
                    target.zoomInfo[z].visibleForce = data[z];
                }
            });
        }
    }

    _provide(setForceVisibleZoom)
});
//# sourceMappingURL=setForceVisibleZoom.js.map

ymaps.modules.define('src.util.zoom.setZoomVisibility', ['util.objectKeys', 'src.util.zoom.getFirstZoomInside'], function (_provide, _utilObjectKeys, getFirstZoomInside) {

    /**
     * Fill info about visibility label in center
     */
    function setZoomVisibility(map, target, coords, labelSize) {
        var autoZoom = getFirstZoomInside(map, target.autoCenter, coords, labelSize);

        _utilObjectKeys(target.zoomInfo).forEach(function (z) {
            if (!target.zoomInfo[z].center) {
                target.zoomInfo[z].visible = z >= autoZoom;
            } else {
                var zoom = getFirstZoomInside(map, target.zoomInfo[z].center, coords, labelSize);
                target.zoomInfo[z].visible = z >= zoom;
            }
        });
    }

    _provide(setZoomVisibility)
});
//# sourceMappingURL=setZoomVisibility.js.map

ymaps.modules.define('src.util.zoom.setZoomVisibilityForGeoObject', ['util.objectKeys', 'src.util.zoom.getFirstZoomInside', 'src.label.util.getLayoutSize'], function (_provide, _utilObjectKeys, getFirstZoomInside, getLayoutSize) {
    _provide(function (map, labelData, coordinates, labelInst) {
        var dotSize = getLayoutSize(labelInst.getLayout().dot);
        labelData.dotSize = dotSize;

        analyseDot(map, labelInst, labelData, coordinates, labelInst.getLayout().dot, dotSize);
        _utilObjectKeys(labelData.zoomInfo).forEach(function (z) {
            analyseLabel(map, labelInst, labelData, z, coordinates, labelInst.getLayout().label);
        });
        return Promise.resolve();
    });

    function getVisible(currentType, newType, newIsVisible) {
        var types = ['none', 'dot', 'label'];
        var result = currentType;
        if (newIsVisible) {
            result = types.indexOf(newType) > types.indexOf(currentType) ? newType : currentType;
        }
        return result;
    }

    function analyseDot(map, labelInst, labelData, coordinates, layout, size) {
        _utilObjectKeys(labelData.zoomInfo).forEach(function (z) {
            var zoomInfo = labelData.zoomInfo[z];
            var zoom = void 0;
            if (!zoomInfo.center) {
                zoom = getFirstZoomInside(map, labelData.autoCenter, coordinates, size, zoomInfo.labelOffset);
            } else {
                zoom = getFirstZoomInside(map, zoomInfo.center, coordinates, size, zoomInfo.labelOffset);
            }
            zoomInfo.visible = getVisible(zoomInfo.visible, 'dot', z >= zoom);
        });
    }

    function analyseLabel(map, labelInst, labelData, zoom, coordinates, layout) {
        var zoomInfo = labelData.zoomInfo[zoom];
        labelInst.setStyles(zoomInfo.style);
        var size = getLayoutSize(layout);
        zoomInfo.labelSize = size;
        var firstZoom = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter, coordinates, size, zoomInfo.labelOffset);
        zoomInfo.visible = getVisible(zoomInfo.visible, 'label', zoom >= firstZoom);
    }
});
//# sourceMappingURL=setZoomVisibilityForGeoObject.js.map
