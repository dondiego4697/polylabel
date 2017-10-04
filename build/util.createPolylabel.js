ymaps.modules.define('setCenter', ['util.array', 'util.objectKeys', 'getPolesOfInaccessibility', 'parseZoomData'], function (_provide, _utilArray, _utilObjectKeys, getPolylabelCenter, parseZoomData) {

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
        } else if (Object.prototype.toString.call(labelCenterCoords) === '[object Object]') {
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

ymaps.modules.define('config', [], function (_provide) {
    _provide({
        MIN_ZOOM: 0,
        MAX_ZOOM: 19,
        options: ['labelLayout', 'labelDotLayout', 'labelClassName', 'labelForceVisible', 'labelTextColor', 'labelTextSize', 'labelCenterCoords'],
        properties: []
    });
});
//# sourceMappingURL=config.js.map

ymaps.modules.define('Label', ['util.extend', 'Placemark', 'XPlacemark', 'createLabelLayoutTemplate'], function (_provide, _utilExtend, Placemark, XPlacemark, createLabelLayoutTemplate) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var LabelForCollection = function () {
        function LabelForCollection(geoObject, options, properties, parentCollection) {
            _classCallCheck(this, LabelForCollection);

            if (!geoObject || !parentCollection) {
                throw new Error('wrong argument');
            }
            this._geoObject = geoObject;
            this._parentCollection = parentCollection;
            this._options = _utilExtend({}, options);
            this._properties = _utilExtend({}, properties);
            this._label = null;
            this._size = {
                width: 0,
                height: 0
            };
            this._initLabel();
        }

        /**
         * @return {Placemark} The instance of Placemark.
         */


        LabelForCollection.prototype.getPlacemark = function getPlacemark() {
            return this._label;
        };

        LabelForCollection.prototype._calculateLabelSize = function _calculateLabelSize(size) {
            this.removeFromCollection();
            var h = size.height / 2;
            var w = size.width / 2;
            this._setSize(size);

            this._label = LabelForCollection._createPlacemark({
                options: _utilExtend({}, this._label.options.getAll(), {
                    iconShape: { //TODO может уже быть задана iconShape
                        type: 'Rectangle',
                        coordinates: [[-w, -h], [w, h]]
                    },
                    iconTop: -h,
                    iconLeft: -w
                })
            });
            this.addToCollection();
        };

        LabelForCollection.prototype._setSize = function _setSize(size) {
            this._size.width = size.width;
            this._size.height = size.height;
        };

        LabelForCollection.prototype.removeFromCollection = function removeFromCollection() {
            if (!this._parentCollection || this._parentCollection.indexOf(this._label) === -1) {
                return false;
            }
            this._parentCollection.remove(this._label);
        };

        LabelForCollection.prototype.addToCollection = function addToCollection() {
            if (!this._parentCollection) {
                return false;
            }
            this._parentCollection.add(this._label);
        };

        LabelForCollection.prototype._initLabel = function _initLabel() {
            var labelLayout = this._options.labelLayout;

            labelLayout = createLabelLayoutTemplate(labelLayout);
            /* if (labelTemplate) {
                let type = typeof labelTemplate;
                if (type === 'function') {
                    template = labelTemplate;
                } else {
                    template = createLabelLayoutTemplate(labelTemplate);
                }
            } else {
                Object.assign(this._options, this._getTextLabelOption());
            } */
            this._label = LabelForCollection._createPlacemark({
                properties: this._properties,
                options: this._options
            }, labelLayout);
            this._label.properties.set('labelPolygon', this._geoObject);
        };

        LabelForCollection._createPlacemark = function _createPlacemark(params, layout) {
            var properties = params.properties,
                options = params.options;

            options = _utilExtend({}, {
                iconLayout: layout,
                iconLabelPosition: 'absolute',
                pointOverlay: XPlacemark
            }, options);
            return new Placemark([0, 0], properties, options);
        };

        LabelForCollection.prototype._setCoordinates = function _setCoordinates(coords) {
            if (coords !== this._label.geometry.getCoordinates()) {
                this._label.geometry.setCoordinates(coords);
            }
        };

        LabelForCollection.prototype._setVisibility = function _setVisibility(isVisible) {
            var pane = isVisible ? 'places' : 'phantom';
            if (this._label.options.get('pane') !== pane) {
                this._label.options.set({ pane: pane });
            }
        };

        LabelForCollection.prototype._setStyles = function _setStyles(data) {
            var className = data.className,
                textColor = data.textColor,
                textSize = data.textSize;

            this._options.labelTextSize = textSize;
            this._options.labelTextColor = textColor;
            this._options.labelTextClassName = className;
            if (data.size) {
                this._size.height = data.size.height || this._size.height;
                this._size.width = data.size.width || this._size.width;
            }
            this._label.options.set(this._getTextLabelOption());
        };

        LabelForCollection.prototype._getTextLabelOption = function _getTextLabelOption() {
            var _options = this._options,
                labelTextClassName = _options.labelTextClassName,
                labelTextColor = _options.labelTextColor,
                labelTextSize = _options.labelTextSize;
            var _size = this._size,
                w = _size.width,
                h = _size.height;

            return {
                iconLabelClassName: this._isObject(labelTextClassName) ? '' : labelTextClassName,
                iconLabelText: this._properties.labelText || '',
                iconLabelTextSize: this._isObject(labelTextSize) ? '' : labelTextSize,
                iconLabelTextColor: this._isObject(labelTextColor) ? '' : labelTextColor,
                iconTop: -(h / 2),
                iconLeft: -(w / 2)
            };
        };

        LabelForCollection.prototype._isObject = function _isObject(val) {
            return Object.prototype.toString.call(val) === '[object Object]';
        };

        LabelForCollection.prototype.destroy = function destroy() {
            this.removeFromCollection();
            this._label = undefined;
        };

        return LabelForCollection;
    }();

    _provide(LabelForCollection);
});
//# sourceMappingURL=Label.js.map

ymaps.modules.define('LabelForCollection', ['util.extend', 'util.objectKeys', 'Placemark', 'XPlacemark', 'createLabelLayoutTemplate', 'createDotLayoutTemplate', 'getLabelLayout'], function (_provide, _utilExtend, _utilObjectKeys, Placemark, XPlacemark, createLabelLayoutTemplate, createDotLayoutTemplate, getLabelLayout) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var LabelForCollection = function () {
        function LabelForCollection(polygon, options, properties, parentCollection) {
            _classCallCheck(this, LabelForCollection);

            if (!polygon || !parentCollection) {
                throw new Error('wrong argument');
            }
            this._polygon = polygon;
            this._parentCollection = parentCollection;
            this._options = _utilExtend({}, options);
            this._properties = _utilExtend({}, properties);
            this._placemark = {
                label: null,
                dot: null
            };
            this._layout = {
                label: null,
                dot: null
            };
            this._size = {
                label: {
                    w: 0,
                    h: 0
                },
                dot: {
                    w: 0,
                    h: 0
                }
            };
            this._init();
        }

        LabelForCollection.prototype.getPlacemark = function getPlacemark() {
            return this._placemark;
        };

        LabelForCollection.prototype.getLayout = function getLayout() {
            return this._layout;
        };

        LabelForCollection.prototype._saveSize = function _saveSize(type, size) {
            this._size[type] = {
                w: size.width,
                h: size.height
            };
        };

        LabelForCollection.prototype.removeFromCollection = function removeFromCollection(types) {
            var _this = this;

            types.forEach(function (type) {
                if (!_this._parentCollection || _this._parentCollection.indexOf(_this._placemark[type]) === -1) {
                    return;
                }
                _this._parentCollection.remove(_this._placemark[type]);
            });
        };

        LabelForCollection.prototype.addToCollection = function addToCollection(types) {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                if (!_this2._parentCollection) {
                    reject();
                    return;
                }
                var promises = [];
                types.forEach(function (type) {
                    _this2._parentCollection.add(_this2._placemark[type]);
                    promises.push(new Promise(function (resolve) {
                        getLabelLayout(_this2._placemark[type]).then(function (layout) {
                            _this2._layout[type] = layout;
                            resolve();
                        });
                    }));
                });

                Promise.all(promises).then(function () {
                    resolve();
                });
            });
        };

        LabelForCollection.prototype._init = function _init() {
            var _options = this._options,
                labelLayout = _options.labelLayout,
                labelDotLayout = _options.labelDotLayout;

            labelLayout = createLabelLayoutTemplate(labelLayout);
            labelDotLayout = createDotLayoutTemplate(labelDotLayout);

            this._placemark.label = LabelForCollection._createPlacemark({
                properties: _utilExtend(this._properties, {
                    '_labelPolygon': this._polygon
                }),
                options: this._options
            }, labelLayout);

            this._placemark.dot = LabelForCollection._createPlacemark({
                properties: _utilExtend(this._properties, {
                    '_labelPolygon': this._polygon
                })
            }, labelDotLayout);
        };

        LabelForCollection._createPlacemark = function _createPlacemark(params, layout) {
            var properties = params.properties,
                options = params.options;

            options = _utilExtend({}, {
                iconLayout: layout,
                iconLabelPosition: 'absolute',
                pointOverlay: XPlacemark
            }, options);
            return new Placemark([0, 0], properties, options);
        };

        LabelForCollection.prototype._setLayoutTemplate = function _setLayoutTemplate(types, templates) {
            var _this3 = this;

            var createLayoutTemplate = {
                label: createLabelLayoutTemplate,
                dot: createDotLayoutTemplate
            };

            return Promise.all(types.map(function (type, i) {
                var iconLayout = createLayoutTemplate[type](templates[i]);
                _this3._placemark[type].options.set({ iconLayout: iconLayout });
                /* return getLabelLayout(this._placemark[type]).then(layout => {
                    this._layout[type] = layout;
                }); */
            }));
        };

        LabelForCollection.prototype._setCoordinates = function _setCoordinates(coords) {
            var _this4 = this;

            if (coords !== this._placemark.label.geometry.getCoordinates()) {
                ['dot', 'label'].forEach(function (type) {
                    _this4._placemark[type].geometry.setCoordinates(coords);
                });
            }
        };

        LabelForCollection.prototype._setVisibility = function _setVisibility(visibleType) {
            var _this5 = this;

            _utilObjectKeys(this._placemark).forEach(function (type) {
                var pane = type === visibleType ? 'places' : 'phantom';
                _this5._placemark[type].options.set({ pane: pane });
            });
        };

        LabelForCollection.prototype._setStyles = function _setStyles(data) {
            var className = data.className,
                textColor = data.textColor,
                textSize = data.textSize;

            this._options.labelTextSize = textSize;
            this._options.labelTextColor = textColor;
            this._options.labelTextClassName = className;
            this._placemark.label.options.set(this._getLabelStyleOption('label'));
        };

        LabelForCollection.prototype._setSize = function _setSize(type, size) {
            var h = size.height / 2;
            var w = size.width / 2;
            this._saveSize(type, size);
            this._placemark[type].options.set(_utilExtend({}, {
                iconShape: {
                    type: 'Rectangle',
                    coordinates: [[-w, -h], [w, h]]
                }
            }, this._getLabelStyleOption(type)));
        };

        LabelForCollection.prototype._getLabelStyleOption = function _getLabelStyleOption(type) {
            var _options2 = this._options,
                labelTextClassName = _options2.labelTextClassName,
                labelTextColor = _options2.labelTextColor,
                labelTextSize = _options2.labelTextSize;
            var _size$type = this._size[type],
                w = _size$type.w,
                h = _size$type.h;

            return {
                iconLabelClassName: this._isObject(labelTextClassName) ? '' : labelTextClassName,
                iconLabelTextSize: this._isObject(labelTextSize) ? '' : labelTextSize,
                iconLabelTextColor: this._isObject(labelTextColor) ? '' : labelTextColor,
                iconLabelTop: -(h / 2),
                iconLabelLeft: -(w / 2)
            };
        };

        LabelForCollection.prototype._isObject = function _isObject(val) {
            return Object.prototype.toString.call(val) === '[object Object]';
        };

        LabelForCollection.prototype.destroy = function destroy() {
            this.removeFromCollection(['dot', 'label']);
        };

        return LabelForCollection;
    }();

    _provide(LabelForCollection);
});
//# sourceMappingURL=LabelForCollection.js.map

ymaps.modules.define('LabelForObjectManager', ['util.extend', 'GeoObject', 'stringReplacer', 'ObjectManager', 'Placemark', 'transformGeoObjectToObject'], function (_provide, _utilExtend, GeoObject, stringReplacer, ObjectManager, Placemark, transformGeoObjectToObject) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var Label = function () {
        function Label(geoObject, options, LayoutClass, parentCollection) {
            _classCallCheck(this, Label);

            if (!geoObject || !LayoutClass) {
                throw new Error('wrong argument');
            }
            this._geoObject = geoObject;
            this._parentCollection = parentCollection;
            this._options = options;
            this._label = null;
            this._id = null;
            this._LayoutClass = LayoutClass;
            this._initLabel();
        }

        /**
         * @return {Placemark} The instance of Placemark.
         */


        Label.prototype.getPlacemark = function getPlacemark() {
            return this._label;
        };

        Label.prototype.calculateLabelSize = function calculateLabelSize(size) {
            this.removeFromCollection();
            var h = size.height / 2;
            var w = size.width / 2;
            this._label = Label._createPlacemark({
                properties: _utilExtend({}, this._label.properties.getAll(), {
                    top: -h,
                    left: -w
                }),
                options: _utilExtend({}, this._label.options.getAll(), {
                    iconShape: { //TODO может уже быть задана
                        type: 'Rectangle',
                        coordinates: [[-w, -h], [w, h]]
                    }
                })
            }, this._LayoutClass);
            this.addToCollection();
        };

        Label.prototype.removeFromCollection = function removeFromCollection() {
            if (!this._parentCollection) {
                return false;
            }
            if (this._parentCollection instanceof ObjectManager && this._id) {
                this._parentCollection.remove(transformGeoObjectToObject(this._label, this._id));
            } else {
                this._parentCollection.remove(this._label);
            }
        };

        Label.prototype.addToCollection = function addToCollection() {
            if (!this._parentCollection) {
                return false;
            }
            if (this._parentCollection instanceof ObjectManager) {
                var id = 'PolygonLabel#' + this._geoObject.id;
                this._parentCollection.add(transformGeoObjectToObject(this._label, id));
                this._id = id;
                return id;
            } else {
                this._parentCollection.add(this._label);
            }
        };

        Label.prototype._initLabel = function _initLabel() {
            var labelHtml = this._options.labelHtml;

            var result = void 0;
            if (labelHtml) {
                result = labelHtml;
            } else {
                result = this._createLabelContentWithPresets();
            }
            this._label = Label._createPlacemark({
                properties: {
                    html: result
                },
                options: this._options
            }, this._LayoutClass);
        };

        Label._createPlacemark = function _createPlacemark(params, LayoutClass) {
            var properties = params.properties,
                options = params.options;

            properties = _utilExtend({}, {
                top: 0,
                left: 0,
                position: 'absolute'
            }, properties);
            options = _utilExtend({}, {
                iconLayout: LayoutClass
            }, options);
            return new Placemark([0, 0], properties, options);
        };

        Label.prototype._createLabelContentWithPresets = function _createLabelContentWithPresets() {
            var _options = this._options,
                labelText = _options.labelText,
                labelTextClassName = _options.labelTextClassName,
                labelTextSize = _options.labelTextSize,
                outlineColor = _options.outlineColor,
                textColor = _options.textColor;

            var textShadow = '\n        1px 1px 0 ' + outlineColor + ',\n        -1px -1px 0 ' + outlineColor + ',\n        1px -1px 0 ' + outlineColor + ',\n        -1px 1px 0 ' + outlineColor;
            var template = '<div class="$1" style="font-size: $2; color: $3; text-shadow: $4">$5</div>';
            return stringReplacer(template, [labelTextClassName, labelTextSize, textColor, textShadow, labelText]);
        };

        Label.prototype._initEvents = function _initEvents() {
            //this._label.events.add('click', this._labelClick, this);
        };

        Label.prototype._labelClick = function _labelClick() {
            if (this._geoObject instanceof GeoObject) {
                this._geoObject.events.fire('labelClick', {
                    targetLabel: this._label
                });
            } else {
                //TODO labelClick for ObjectManager
            }
        };

        Label.prototype._removeClickEvent = function _removeClickEvent() {
            this._label.events.remove('click', this._labelClick, this);
        };

        Label.prototype.destroy = function destroy() {
            this._removeClickEvent();
            this.removeFromCollection();
            this._label = undefined;
        };

        return Label;
    }();

    _provide(Label);
});
//# sourceMappingURL=LabelForObjectManager.js.map

ymaps.modules.define('createDotLayoutTemplate', ['templateLayoutFactory'], function (_provide, templateLayoutFactory) {
    var defaultDotTemplate = '<div {% style %}background-color: red; width: 10px; height: 10px; border-radius: 50px;{% endstyle %}></div>';

    _provide(function (template) {
        if (typeof template === 'undefined') {
            template = defaultDotTemplate;
        }
        return templateLayoutFactory.createClass('\n    <div {% style %}position: {{options.labelPosition}}; top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>\n        ' + template + '\n    </div>');
    });
});
//# sourceMappingURL=createDotLayoutTemplate.js.map

ymaps.modules.define('createLabelLayoutTemplate', ['templateLayoutFactory'], function (_provide, templateLayoutFactory) {
    _provide(function (template) {
        return templateLayoutFactory.createClass('\n    <div {% style %}position: {{options.labelPosition}}; top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>\n        <div class="{{options.labelClassName}}"\n            {% style %}font-size: {{options.labelTextSize}}px; color: {{options.labelTextColor}}; {% endstyle %}>\n            ' + template + '\n        </div>\n    </div>');
    });
});
//# sourceMappingURL=createLabelLayoutTemplate.js.map

ymaps.modules.define('LabelLayoutTemplate', ['templateLayoutFactory', 'config'], function (_provide, templateLayoutFactory, CONFIG) {

  /**
   * Label layout tamplate
   */
  /* const template = templateLayoutFactory.createClass(
      `<div class="{{options.labelClassName}}"
       {% style %}font-size: {{options.labelTextSize}}px; color: {{options.labelTextColor}}; {% endstyle %}>{{options.labelText}}</div>`
  ); */
  var template = templateLayoutFactory.createClass('');

  _provide(template);
});
//# sourceMappingURL=LabelLayoutTemplate.js.map

ymaps.modules.define('PBased', ['config', 'GeoObject', 'option.presetStorage'], function (_provide, CONFIG, GeoObject, presetStorage) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var PBased = function () {
        function PBased(map) {
            _classCallCheck(this, PBased);

            this._map = map;
        }

        PBased.prototype.initMapListeners = function initMapListeners(callback) {
            this._mapBoundsChangeCallback = callback;
            this._map.events.add('boundschange', this._mapBoundsChangeHandler, this);
        };

        PBased.prototype.destroyMapListeners = function destroyMapListeners() {
            this._map.events.remove('boundschange', this._mapBoundsChangeHandler, this);
        };

        PBased.prototype._mapBoundsChangeHandler = function _mapBoundsChangeHandler(event) {
            if (event.get('newZoom') !== event.get('oldZoom')) {
                this._mapBoundsChangeCallback();
            }
        };

        PBased.prototype.getOptions = function getOptions(obj) {
            return CONFIG.options.reduce(function (result, key) {
                result[key] = obj instanceof GeoObject ? obj.options.get(key) : obj.options[key];
                return result;
            }, {});
        };

        PBased.prototype.getProperties = function getProperties(obj) {
            return CONFIG.properties.reduce(function (result, key) {
                result[key] = obj instanceof GeoObject ? obj.properties.get(key) : obj.properties[key];
                return result;
            }, {});
        };

        return PBased;
    }();

    _provide(PBased);
});
//# sourceMappingURL=PBased.js.map

ymaps.modules.define('PCollection', ['util.defineClass', 'util.objectKeys', 'PBased', 'config', 'LabelForCollection', 'setCenter', 'setZoomVisibilityForGeoObject', 'setForceVisibleZoom', 'parseZoomData', 'createDefaultLabelData', 'GeoObjectCollection', 'data.Manager', 'Monitor', 'system.nextTick'], function (_provide, _utilDefineClass, _utilObjectKeys, PBased, CONFIG, LabelForCollection, setCenter, setZoomVisibilityForGeoObject, setForceVisibleZoom, parseZoomData, createDefaultLabelData, GeoObjectCollection, DataManager, Monitor, nextTick) {
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

    var PCollection = function (_PBased) {
        _utilDefineClass(PCollection, _PBased);

        function PCollection(map, polygonsCollection) {
            _classCallCheck(this, PCollection);

            var _this = _possibleConstructorReturn(this, _PBased.call(this, map));

            _this._map = map;
            _this._labelsCollection = new GeoObjectCollection();
            _this._labelsState = new WeakMap();
            _this._polygonsCollection = polygonsCollection;
            _this._currentConfiguredVisibility = new WeakMap();
            _this._currentVisibility = new WeakMap();
            _this._initData();
            return _this;
        }

        PCollection.prototype.destroy = function destroy() {
            this._deleteLabelStateListeners();
            this._deletePolygonsListeners();
            this._deletePolygonCollectionListeners();
            this._clearLabelCollection();
            this._map.geoObjects.remove(this._labelsCollection);
        };

        PCollection.prototype.getLabelState = function getLabelState(polygon) {
            return this._labelsState.get(polygon);
        };

        PCollection.prototype.getConfiguredVisibility = function getConfiguredVisibility(polygon) {
            return this._currentConfiguredVisibility.get(polygon);
        };

        PCollection.prototype.getCurrentVisibility = function getCurrentVisibility(polygon) {
            return this._currentVisibility.get(polygon);
        };

        PCollection.prototype._initData = function _initData() {
            var _this2 = this;

            this._map.geoObjects.add(this._labelsCollection);
            this._calculateCollections(true).then(function () {
                _this2._initMapListeners();
                _this2._initPolygonCollectionListeners();
                _this2._initPolygonsListeners();
            });
        };

        PCollection.prototype._calculateCollections = function _calculateCollections(isFirstCalc) {
            var _this3 = this;

            var promises = [];
            if (isFirstCalc) {
                this._clearLabelCollection();
            }
            this._polygonsCollection.each(function (polygon) {
                if (isFirstCalc) {
                    _this3._setLabelState(polygon, 'visible', undefined);
                    _this3._initLabelStateListener(polygon);
                    _this3._calculatePolygonLabelData(polygon).then(function (labelData) {
                        _this3._setLabelState(polygon, '_labelData', labelData);
                        promises.push(_this3._analyzeAndSetLabelData(_this3._map, polygon, _this3._getLabelState(polygon, '_labelData')));
                    });
                } else {
                    promises.push(_this3._analyzeAndSetLabelData(_this3._map, polygon, _this3._getLabelState(polygon, '_labelData')));
                }
            });
            return Promise.all(promises);
        };

        PCollection.prototype._clearLabelCollection = function _clearLabelCollection() {
            this._labelsCollection.removeAll();
            this._labelsCollection.options.set({
                pane: 'phantom'
            });
        };

        PCollection.prototype._calculatePolygonLabelData = function _calculatePolygonLabelData(polygon, isLabelInstCreated) {
            var _this4 = this;

            var options = this.getOptions(polygon);
            var properties = this.getProperties(polygon);
            var labelData = createDefaultLabelData();
            setForceVisibleZoom(labelData, options.labelForceVisible);
            var coordinates = polygon.geometry.getCoordinates();
            setCenter(labelData, coordinates, options.labelCenterCoords);

            var labelInst = void 0;
            if (isLabelInstCreated) {
                labelInst = this._getLabelState(polygon, '_labelData').label;
            } else {
                labelInst = new LabelForCollection(polygon, options, properties, this._labelsCollection);
            }
            labelData.label = labelInst;

            return new Promise(function (resolve) {
                labelInst.addToCollection(['dot', 'label']).then(function () {
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
                    setZoomVisibilityForGeoObject(_this4._map, labelData, coordinates[labelData.polygonIndex], labelInst).then(function () {
                        resolve(labelData);
                    });
                });
            });
        };

        PCollection.prototype._analyzeAndSetLabelData = function _analyzeAndSetLabelData(map, polygon, labelData, visibleState) {
            var _this5 = this;

            return new Promise(function (resolve) {
                if (!labelData) {
                    resolve();
                    return;
                }
                var zoomInfo = labelData.zoomInfo,
                    autoCenter = labelData.autoCenter,
                    label = labelData.label;

                zoomInfo = zoomInfo[map.getZoom()];
                _this5._setCurrentConfiguredVisibility(polygon, zoomInfo.visible, zoomInfo.visibleForce);
                label._setCoordinates(zoomInfo.center || autoCenter);
                visibleState = visibleState ? visibleState : zoomInfo.visibleForce;
                var visibleType = visibleState === 'auto' ? zoomInfo.visible : visibleState;
                _this5._setCurrentVisibility(polygon, visibleType);
                label._setVisibility(visibleType);
                if (['dot', 'label'].includes(visibleState)) {
                    label._setSize(visibleState, visibleState === 'dot' ? labelData.dotSize : zoomInfo.labelSize);
                }
                label._setStyles(zoomInfo.style);
                resolve();
            });
        };

        PCollection.prototype._setCurrentConfiguredVisibility = function _setCurrentConfiguredVisibility(polygon, visible, visibleForce) {
            var result = visibleForce && ['dot', 'label', 'none'].includes(visibleForce) ? visibleForce : visible;
            this._currentConfiguredVisibility.set(polygon, result);
        };

        PCollection.prototype._setCurrentVisibility = function _setCurrentVisibility(polygon, type) {
            this._currentVisibility.set(polygon, ['dot', 'label'].includes(type) ? type : 'none');
        };

        PCollection.prototype._recalculateNewPolygon = function _recalculateNewPolygon(polygon) {
            var _this6 = this;

            this._calculatePolygonLabelData(polygon).then(function (labelData) {
                _this6._setLabelState(polygon, '_labelData', labelData);
                _this6._analyzeAndSetLabelData(_this6._map, polygon, _this6._getLabelState(polygon, '_labelData'));
            });
        };

        PCollection.prototype._setLabelState = function _setLabelState(polygon, key, value) {
            var labelState = this._labelsState.get(polygon);
            if (!labelState) {
                labelState = new DataManager();
                this._labelsState.set(polygon, labelState);
            }
            labelState.set(key, value);
        };

        PCollection.prototype._getLabelState = function _getLabelState(polygon, key) {
            var labelState = this._labelsState.get(polygon);
            if (labelState) {
                return labelState.get(key);
            }
        };

        PCollection.prototype._clearVisibilityInLabelsState = function _clearVisibilityInLabelsState() {
            var _this7 = this;

            this._polygonsCollection.each(function (polygon) {
                _this7._setLabelState(polygon, 'visible', undefined);
            });
        };

        PCollection.prototype._polygonCollectionEventHandler = function _polygonCollectionEventHandler(event) {
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
        };

        PCollection.prototype._deleteLabelStateListeners = function _deleteLabelStateListeners() {
            var _this8 = this;

            this._polygonsCollection.each(function (polygon) {
                _this8._deleteLabelStateListener(polygon);
            });
        };

        PCollection.prototype._deleteLabelStateListener = function _deleteLabelStateListener(polygon) {
            var monitor = this._getLabelState(polygon, 'labelMonitor');
            if (monitor) {
                monitor.removeAll();
            }
        };

        PCollection.prototype._initLabelStateListener = function _initLabelStateListener(polygon) {
            var _this9 = this;

            var monitor = new Monitor(this._labelsState.get(polygon));
            this._setLabelState(polygon, 'labelMonitor', monitor);
            monitor.add('visible', function (newValue) {
                _this9._analyzeAndSetLabelData(_this9._map, polygon, _this9._getLabelState(polygon, '_labelData'), newValue);
            });
        };

        PCollection.prototype._initPolygonsListeners = function _initPolygonsListeners() {
            var _this10 = this;

            this._polygonsCollection.each(function (polygon) {
                _this10._initPolygonListener(polygon);
            });
        };

        PCollection.prototype._initPolygonListener = function _initPolygonListener(polygon) {
            polygon.events.add(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
            polygon.events.add('parentchange', this._onPolygonParentChangeHandler, this);
        };

        PCollection.prototype._onPolygonParentChangeHandler = function _onPolygonParentChangeHandler(event) {
            this._isPolygonParentChange = true;
        };

        PCollection.prototype._onPolygonOptionsChangeHandler = function _onPolygonOptionsChangeHandler(event) {
            var _this11 = this;

            nextTick(function () {
                if (!_this11._isPolygonParentChange) {
                    var polygon = event.get('target');
                    var labelData = _this11._getLabelState(polygon, '_labelData');
                    labelData.label._setLayoutTemplate(['label', 'dot'], [polygon.options.get('labelLayout'), polygon.options.get('labelDotLayout')]).then(function () {
                        _this11._calculatePolygonLabelData(polygon, true).then(function (labelData) {
                            _this11._setLabelState(polygon, '_labelData', labelData);
                            _this11._analyzeAndSetLabelData(_this11._map, polygon, _this11._getLabelState(polygon, '_labelData'));
                        });
                    });
                }
                _this11._isPolygonParentChange = false;
            });
        };

        PCollection.prototype._initPolygonCollectionListeners = function _initPolygonCollectionListeners() {
            this._polygonsCollection.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
        };

        PCollection.prototype._initMapListeners = function _initMapListeners() {
            var _this12 = this;

            this.initMapListeners(function () {
                _this12._clearVisibilityInLabelsState();
                _this12._calculateCollections();
            });
        };

        PCollection.prototype._deletePolygonCollectionListeners = function _deletePolygonCollectionListeners() {
            this._polygonsCollection.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
            this.destroyMapListeners();
        };

        PCollection.prototype._deletePolygonsListeners = function _deletePolygonsListeners() {
            var _this13 = this;

            this._polygonsCollection.each(function (polygon) {
                _this13._deletePolygonListener(polygon);
            });
        };

        PCollection.prototype._deletePolygonListener = function _deletePolygonListener(polygon) {
            polygon.events.remove(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
            polygon.events.remove('parentchange', this._onPolygonParentChangeHandler, this);
        };

        return PCollection;
    }(PBased);

    _provide(PCollection);
});
//# sourceMappingURL=PCollection.js.map

ymaps.modules.define('PObjectManager', ['util.defineClass', 'PBased', 'CalculatorGeoObjectLabelData', 'LabelLayoutTemplate'], function (_provide, _utilDefineClass, PBased, CalculatorGeoObjectLabelData, LabelLayoutTemplate) {
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

    var PObjectManager = function (_PBased) {
        _utilDefineClass(PObjectManager, _PBased);

        function PObjectManager(map, objectManager) {
            _classCallCheck(this, PObjectManager);

            var _this = _possibleConstructorReturn(this, _PBased.call(this, map));

            _this._map = map;
            _this._objectManager = objectManager;
            _this._labelLayoutTemplate = LabelLayoutTemplate;
            _this._initData();
            return _this;
        }

        PObjectManager.prototype.update = function update() {};

        PObjectManager.prototype.destroy = function destroy() {};

        PObjectManager.prototype.getLabels = function getLabels() {};

        PObjectManager.prototype._initData = function _initData() {
            var _this2 = this;

            this._calculatorGeoObjectLabelData = new CalculatorGeoObjectLabelData(this._map, this._labelLayoutTemplate, this._objectManager);
            this._calculatorGeoObjectLabelData.initListenersForObjectManager();
            this._calculateCollections(true).then(function () {
                _this2._initMapListeners();
                //this._calculatorGeoObjectLabelData.removeListenersForObjectManager();
                /* this._initCollectionListeners(); */
            });
        };

        PObjectManager.prototype._calculateCollections = function _calculateCollections(isFirstCalc) {
            var _this3 = this;

            var promises = [];
            if (isFirstCalc) {
                //this._clearLabelCollections();
            }
            var i = 0;
            this._objectManager.objects.each(function (geoObject) {
                if (isFirstCalc) {
                    if (typeof geoObject.id !== 'string' || typeof geoObject.id === 'string' && geoObject.id.indexOf('PolygonLabel') === -1) {
                        _this3._calculateGeoObjectLabelData(geoObject).then(function () {
                            promises.push(analyzeAndSetLabelData(_this3._map, geoObject));
                        });
                    }
                } else {
                    promises.push(analyzeAndSetLabelData(_this3._map, geoObject));
                }
            });
            return Promise.all(promises);
        };

        PObjectManager.prototype._calculateGeoObjectLabelData = function _calculateGeoObjectLabelData(geoObject) {
            var _this4 = this;

            var options = _PBased.prototype.getOptions.call(this, geoObject);
            var properties = _PBased.prototype.getProperties.call(this, geoObject);
            return new Promise(function (resolve) {
                _this4._calculatorGeoObjectLabelData.getLabelData(geoObject, options, properties, _this4._objectManager).then(function (labelData) {
                    geoObject.properties._labelData = labelData;
                    resolve();
                });
                /* calculateGeoObjectLabelData(this._map, geoObject, options, properties, this._labelLayoutTemplate, this._objectManager)
                    .then((labelData) => {
                        geoObject.properties._labelData = labelData;
                        resolve();
                    }); */
            });
        };

        PObjectManager.prototype._initMapListeners = function _initMapListeners() {
            _PBased.prototype.initMapListeners.call(this, function () {
                //console.log(this._objectManager.objects.getLength());
                //this._calculateCollections();
            });
        };

        return PObjectManager;
    }(PBased);

    _provide(PObjectManager);
});
//# sourceMappingURL=PObjectManager.js.map

ymaps.modules.define('Polylabel', ['PCollection', 'PObjectManager', 'ObjectManager'], function (_provide, PCollection, PObjectManager, ObjectManager) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var Polylabel = function () {
        function Polylabel(map, data) {
            _classCallCheck(this, Polylabel);

            this._instance = data instanceof ObjectManager ? new PObjectManager(map, data) : new PCollection(map, data);
        }

        Polylabel.prototype.getLabelState = function getLabelState(polygon) {
            return this._instance.getLabelState(polygon);
        };

        Polylabel.prototype.getConfiguredVisibility = function getConfiguredVisibility(polygon) {
            return this._instance.getConfiguredVisibility(polygon);
        };

        Polylabel.prototype.getCurrentVisibility = function getCurrentVisibility(polygon) {
            return this._instance.getCurrentVisibility(polygon);
        };

        Polylabel.prototype.destroy = function destroy() {
            this._instance.destroy();
        };

        return Polylabel;
    }();

    _provide(Polylabel);
});
//# sourceMappingURL=Polylabel.js.map

ymaps.modules.define('CalculatorGeoObjectLabelData', ['GeoObject', 'ObjectManager', 'createDefaultLabelData', 'setCenter', 'setZoomVisibility', 'Label'], function (_provide, GeoObject, ObjectManager, createDefaultLabelData, setCenter, setZoomVisibility, Label) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var CalculatorGeoObjectLabelData = function () {
        function CalculatorGeoObjectLabelData(map, LabelLayoutTemplate, data) {
            _classCallCheck(this, CalculatorGeoObjectLabelData);

            this._map = map;
            this._LabelLayoutTemplate = LabelLayoutTemplate;
            this._data = data;
            this._storage = {};
        }

        CalculatorGeoObjectLabelData.prototype.getLabelData = function getLabelData(geoObject, options, properties, data) {
            var _this = this;

            var labelData = createDefaultLabelData();
            var coordinates = geoObject instanceof GeoObject ? geoObject.geometry.getCoordinates() : geoObject.geometry.coordinates;
            setCenter(labelData, coordinates, properties.labelCenterCoords);
            var labelInst = new Label(geoObject, options, this._LabelLayoutTemplate, data);
            var labelId = labelInst.addToCollection();

            return new Promise(function (resolve) {
                if (data instanceof ObjectManager) {
                    if (labelId) {
                        _this._storage[labelId] = {
                            resolve: resolve,
                            labelData: labelData,
                            labelInst: labelInst,
                            coordinates: coordinates,
                            options: options
                        };
                    }
                } else {
                    labelInst.getPlacemark().getOverlay().then(function (overlay) {
                        return overlay.getLayout();
                    }).then(function (layout) {
                        var size = layout.getElement().firstChild.getBoundingClientRect();
                        labelInst.calculateLabelSize(size);
                        labelInst._initEvents();
                        setZoomVisibility(map, labelData, coordinates, size, options.labelForceVisibleZoom);
                        labelData.label = labelInst;
                        resolve(labelData);
                    });
                }
            });
        };

        CalculatorGeoObjectLabelData.prototype.removeListenersForObjectManager = function removeListenersForObjectManager() {
            this._data.objects.overlays.events.remove('add', this._listenersForOM, this);
        };

        CalculatorGeoObjectLabelData.prototype.initListenersForObjectManager = function initListenersForObjectManager() {
            if (!this._overlaysListener) {
                this._data.objects.overlays.events.add('add', this._listenersForOM, this);
                this._data.objects.overlays.events.add('remove', function (event) {
                    console.log('remove');
                }, this);
                this._overlaysListener = true;
            }
        };

        CalculatorGeoObjectLabelData.prototype._listenersForOM = function _listenersForOM(event) {
            //TODO каждый раз удаляет и создает overlay
            console.log('add');
            var objectId = event.get('objectId');
            if (typeof objectId === 'string' && objectId.indexOf('PolygonLabel#') === 0) {
                var overlay = event.get('overlay');
                this._storage[objectId].overlay = overlay;
                overlay.events.add('mapchange', this._mapChangeHandler, {
                    context: this,
                    objectId: objectId
                });
            }
        };

        CalculatorGeoObjectLabelData.prototype._mapChangeHandler = function _mapChangeHandler(event) {
            var _this2 = this;

            var data = this.context._storage[this.objectId];
            data.overlay.getLayout().then(function (layout) {
                var size = layout.getElement().firstChild.getBoundingClientRect();
                var _context$_storage$obj = _this2.context._storage[_this2.objectId],
                    resolve = _context$_storage$obj.resolve,
                    labelData = _context$_storage$obj.labelData,
                    labelInst = _context$_storage$obj.labelInst,
                    coordinates = _context$_storage$obj.coordinates,
                    options = _context$_storage$obj.options,
                    overlay = _context$_storage$obj.overlay;

                labelInst.calculateLabelSize(size);
                labelInst._initEvents();
                setZoomVisibility(_this2.context._map, labelData, coordinates, size, options.labelForceVisibleZoom);
                labelData.label = labelInst;
                //console.log(labelData);
                resolve(labelData);
                delete _this2.context._storage[_this2.objectId];
                overlay.events.remove('mapchange', _this2.context._mapChangeHandler, _this2);
            });
        };

        return CalculatorGeoObjectLabelData;
    }();

    _provide(CalculatorGeoObjectLabelData);
});
//# sourceMappingURL=CalculatorGeoObjectLabelData.js.map

ymaps.modules.define("getLabelLayout", [], function (_provide) {
    _provide(function (label) {
        return label.getOverlay().then(function (overlay) {
            return overlay.getLayout();
        });
    });
});
//# sourceMappingURL=getLabelLayout.js.map

ymaps.modules.define("getLabelSize", [], function (_provide) {
    _provide(function (layout) {
        return layout.getElement().firstChild.getBoundingClientRect();
        /* return new Promise((resolve, reject) => {
            label.getOverlay()
                .then(overlay => overlay.getLayout())
                .then(layout => {
                    resolve(layout.getElement().firstChild.getBoundingClientRect());
                }).catch(e => {
                    reject(e);
                });
        }); */
    });
});
//# sourceMappingURL=getLabelSize.js.map

ymaps.modules.define("getLayoutSize", [], function (_provide) {
    _provide(function (layout) {
        var el = layout.getElement();
        if (el.firstChild.nodeName !== "#text") {
            return el.firstChild.getBoundingClientRect();
        } else {
            return el.lastChild.getBoundingClientRect();
        }
    });
});
//# sourceMappingURL=getLayoutSize.js.map

ymaps.modules.define('transformGeoObjectToObject', [], function (_provide) {
    _provide(function (geoObject, id) {
        return {
            id: id,
            type: 'Feature',
            geometry: {
                type: geoObject.geometry.getType(),
                coordinates: geoObject.geometry.getCoordinates()
            },
            options: geoObject.options.getAll(),
            properties: geoObject.properties.getAll()
        };
    });
});
//# sourceMappingURL=transformGeoObjectToObject.js.map

ymaps.modules.define('XPlacemark', ['util.defineClass', 'overlay.Placemark'], function (_provide, _utilDefineClass, overlayPlacemark) {
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

    var XPlacemark = function (_overlayPlacemark) {
        _utilDefineClass(XPlacemark, _overlayPlacemark);

        function XPlacemark(geometry, properties, options) {
            _classCallCheck(this, XPlacemark);

            return _possibleConstructorReturn(this, _overlayPlacemark.call(this, geometry, properties, options));
        }

        XPlacemark.prototype.getData = function getData() {
            var polygon = this._data.geoObject.properties.get('_labelPolygon');
            if (polygon.options.get('labelLayout').indexOf('qweqwe') !== -1) {
                debugger;
            }
            return {
                geoObject: polygon,
                geometry: polygon.geometry,
                properties: polygon.properties,
                options: polygon.options,
                state: polygon.state
            };
        };

        return XPlacemark;
    }(overlayPlacemark);

    _provide(XPlacemark);
});
//# sourceMappingURL=XPlacemark.js.map

ymaps.modules.define('setPresets', ['util.extend', 'option.presetStorage'], function (_provide, _utilExtend, presetStorage) {
    var DATA = {
        Big: createFontSize('20px'),
        Small: createFontSize('12px'),
        BlackInWhiteOutline: createColorPreset('black', 'white'),
        WhiteInBlackOutline: createColorPreset('white', 'black')
    };
    var PREFIX = 'polylabel#';

    _provide(function () {
        presetStorage.add('polylabel#default', _utilExtend({}, createFontSize('16px'), createColorPreset('black')));
        createPresets(presetStorage);
    });

    function createPresets(presetStorage) {
        var sizes = ['Big', 'Small'];
        var colors = ['BlackInWhiteOutline', 'WhiteInBlackOutline'];

        sizes.forEach(function (size) {
            presetStorage.add('' + PREFIX + size, _utilExtend({}, DATA[size]));
        });

        colors.forEach(function (color) {
            presetStorage.add('' + PREFIX + color, _utilExtend({}, DATA[color]));
        });

        sizes.forEach(function (size) {
            colors.forEach(function (color) {
                presetStorage.add('' + PREFIX + size + color, _utilExtend({}, DATA[size], DATA[color]));
            });
        });
    }

    function createFontSize(labelTextSize) {
        return {
            labelTextSize: labelTextSize
        };
    }

    function createColorPreset(textColor, outlineColor) {
        return {
            textColor: textColor,
            outlineColor: outlineColor
        };
    }
});
//# sourceMappingURL=setPresets.js.map

ymaps.modules.define('util.createPolylabel', ['Polylabel'], function (_provide, Polylabel) {
  _provide(function (map, data) {
    return new Polylabel(map, data);
  });
});
//# sourceMappingURL=util.createPolylabel.js.map

ymaps.modules.define('checkPointPosition', [], function (_provide) {
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

ymaps.modules.define('createDefaultLabelData', ['config'], function (_provide, CONFIG) {
    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;

    _provide(function () {
        var i = MIN_ZOOM;
        var result = {
            zoomInfo: {}, // Object with info for every zoom
            autoCenter: [0, 0],
            polygonIndex: 0,
            dotSize: {
                height: 0,
                width: 0
            }
        };
        while (i <= MAX_ZOOM) {
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
                }
            };
            i++;
        }
        return result;
    });
});
//# sourceMappingURL=createDefaultLabelData.js.map

ymaps.modules.define('getPolesOfInaccessibility', ['util.calculateArea'], function (_provide, calculateArea) {
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

ymaps.modules.define('stringReplacer', [], function (_provide) {
    _provide(function (template, argsArr) {
        var result = template;
        argsArr.forEach(function (item, i) {
            result = result.replace(new RegExp('\\$' + (i + 1), 'g'), item);
        });
        return result;
    });
});
//# sourceMappingURL=stringReplacer.js.map

ymaps.modules.define('getFirstZoomInside', ['checkPointPosition', 'config'], function (_provide, isInside, CONFIG) {
    _provide(function (map, center, coords, size) {
        var i = CONFIG.MIN_ZOOM,
            j = CONFIG.MAX_ZOOM;

        var zoom = void 0;
        while (i < j) {
            zoom = Math.floor((i + j) / 2);
            var elemPoints = getElemPoints(map, center, zoom, size);
            if (checkIsInside(map, coords, elemPoints, zoom)) {
                j = zoom;
            } else {
                i = zoom + 1;
            }
        }
        return i;
    });

    function getElemPoints(map, center, zoom, size) {
        var centerProj = map.options.get('projection').toGlobalPixels(center, zoom);
        var w = size.width,
            h = size.height;

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

ymaps.modules.define('parseZoomData', ['util.objectKeys', 'config'], function (_provide, _utilObjectKeys, CONFIG) {
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

ymaps.modules.define('setForceVisibleZoom', ['util.objectKeys', 'parseZoomData'], function (_provide, _utilObjectKeys, parseZoomData) {
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

ymaps.modules.define('setZoomVisibility', ['util.objectKeys', 'getFirstZoomInside'], function (_provide, _utilObjectKeys, getFirstZoomInside) {

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

ymaps.modules.define('setZoomVisibilityForGeoObject', ['util.objectKeys', 'getFirstZoomInside', 'getLayoutSize', 'getLabelLayout', 'setZoomVisibility'], function (_provide, _utilObjectKeys, getFirstZoomInside, getLayoutSize, getLabelLayout, setZoomVisibility) {
    _provide(function (map, labelData, coordinates, labelInst) {
        var promises = [];
        var zoomBuff = {};

        var dotSize = getLayoutSize(labelInst.getLayout().dot);
        labelData.dotSize = {
            width: dotSize.width,
            height: dotSize.height
        };
        promises.push(analyseDot(map, labelInst, labelData, coordinates, labelInst.getLayout().dot, dotSize));
        _utilObjectKeys(labelData.zoomInfo).forEach(function (z) {
            promises.push(analyseLabel(map, labelInst, labelData, z, coordinates, labelInst.getLayout().label, zoomBuff));
        });
        return Promise.all(promises);
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
        return new Promise(function (resolve) {
            labelInst._setSize('dot', size);
            var autoZoom = getFirstZoomInside(map, labelData.autoCenter, coordinates, size);
            var zoom = autoZoom;
            _utilObjectKeys(labelData.zoomInfo).forEach(function (z) {
                var zoomInfo = labelData.zoomInfo[z];
                if (!zoomInfo.center) {
                    zoom = autoZoom;
                } else {
                    zoom = getFirstZoomInside(map, zoomInfo.center, coordinates, size);
                }
                zoomInfo.visible = getVisible(zoomInfo.visible, 'dot', z >= zoom);
            });
            resolve();
        });
    }

    function analyseLabel(map, labelInst, labelData, zoom, coordinates, layout, zoomBuff) {
        return new Promise(function (resolve) {
            var zoomInfo = labelData.zoomInfo[zoom];
            var key = 'label_' + zoomInfo.style.className + '_' + zoomInfo.style.textSize;
            if (zoomBuff[key]) {
                zoomInfo.visible = getVisible(zoomInfo.visible, 'label', zoom >= zoomBuff[key].firstZoom);
                zoomInfo.labelSize = getSize(zoomBuff[key].size);
                resolve();
                return;
            }
            labelInst._setStyles(zoomInfo.style);
            var size = getLayoutSize(layout);
            labelInst._setSize('label', size);
            zoomInfo.labelSize = getSize(size);
            var firstZoom = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter, coordinates, size);
            zoomInfo.visible = getVisible(zoomInfo.visible, 'label', zoom >= firstZoom);
            zoomBuff[key] = {
                firstZoom: firstZoom,
                size: size
            };
            resolve();
        });
    }

    function getSize(size) {
        return {
            width: size.width,
            height: size.height
        };
    }
});
//# sourceMappingURL=setZoomVisibilityForGeoObject.js.map
