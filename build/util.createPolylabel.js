ymaps.modules.define('src.config', [], function (_provide) {
    _provide({
        MIN_ZOOM: 0,
        MAX_ZOOM: 23,
        options: ['labelLayout', 'labelDotLayout', 'labelDotVisible'],
        zoomRangeOptions: ['labelClassName', 'labelForceVisible', 'labelTextColor', 'labelTextSize', 'labelCenterCoords', 'labelOffset', 'labelPermissibleInaccuracyOfVisibility'],
        properties: []
    });
});
//# sourceMappingURL=config.js.map

ymaps.modules.define('src.label.GeoObjectCollection.Label', ['util.extend', 'util.objectKeys', 'Placemark', 'src.label.util.LabelPlacemarkOverlay', 'src.label.util.LabelData', 'src.label.util.layoutTemplates.getBaseLayoutTemplates', 'src.label.util.layoutTemplates.createLayoutTemplates'], function (_provide, _utilExtend, _utilObjectKeys, Placemark, LabelPlacemarkOverlay, LabelData, getBaseLayoutTemplates, createLayoutTemplates) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var Label = function () {
        function Label(map, polygon, parentCollection) {
            _classCallCheck(this, Label);

            this._map = map;
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
            this._baseLayoutTemplates = null;
            this._layoutTemplates = null;
            this._init();
        }

        Label.prototype.getPlacemark = function getPlacemark(type) {
            return this._placemark[type];
        };

        Label.prototype.getLayout = function getLayout(type) {
            return this._layout[type];
        };

        Label.prototype.setLayout = function setLayout(type, layout) {
            this._layout[type] = layout;
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
            this._polygon = null;
            this._parentCollection = null;
            this._placemark = null;
            this._layout = null;
            this._data = null;
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
                return _this2.getLabelLayout(type).then(function (layout) {
                    _this2._layout[type] = layout;
                });
            });
            return Promise.all(layouts);
        };

        Label.prototype.getLabelLayout = function getLabelLayout(type) {
            return this._placemark[type].getOverlay().then(function (overlay) {
                return overlay.getLayout();
            });
        };

        Label.prototype._init = function _init() {
            this._baseLayoutTemplates = getBaseLayoutTemplates();
            this._layoutTemplates = createLayoutTemplates(this._polygon.options.get('labelLayout'), this._polygon.options.get('labelDotLayout'));
        };

        Label.prototype.createPlacemarks = function createPlacemarks() {
            var _this3 = this;

            ['label', 'dot'].forEach(function (type) {
                _this3._placemark[type] = Label._createPlacemark({
                    properties: _utilExtend({}, {
                        polygon: _this3._polygon
                    }, _this3._polygon.properties.getAll()),
                    options: _utilExtend({}, _this3._polygon.options.getAll(), _this3._layoutTemplates[type])
                }, _this3._baseLayoutTemplates[type]);
            });
        };

        Label._createPlacemark = function _createPlacemark(params, layout) {
            var options = _utilExtend({}, {
                iconLayout: layout,
                pointOverlay: LabelPlacemarkOverlay,
                iconLabelPosition: 'absolute'
            }, params.options);
            return new Placemark([0, 0], params.properties, options);
        };

        Label.prototype.createLabelData = function createLabelData(options, zoomRangeOptions) {
            this._data = new LabelData(this._polygon, options, zoomRangeOptions, this._map, this);
            return this._data;
        };

        Label.prototype.getLabelData = function getLabelData() {
            return this._data;
        };

        Label.prototype.setDataByZoom = function setDataByZoom(zoom, visibleState) {
            var _this4 = this;

            ['dot', 'label'].forEach(function (type) {
                if (type === 'label') {
                    var styles = _this4._data.getStyles(zoom);
                    _this4.setStyles({
                        className: styles.className,
                        textSize: styles.textSize,
                        textColor: styles.textColor
                    });
                }
                _this4._data.setVisible(zoom, type, _this4._layout[type]);
            });

            var currentVisibleType = this.setVisibility(visibleState, this._data.getVisibility(zoom), this._data.getData('dotVisible'));

            if (['label', 'dot'].indexOf(currentVisibleType) !== -1 && this._data.getSize(zoom, currentVisibleType)) {
                this.setCoordinates(this._data.getCenterCoords(zoom));
                this.setCenterAndIconShape(currentVisibleType, this._data.getSize(zoom, currentVisibleType), this._data.getOffset(zoom));
            }

            return {
                currentVisibleType: currentVisibleType,
                currentConfiguredVisibileType: this._data.getVisibility(zoom)
            };
        };

        Label.prototype.setLayoutTemplate = function setLayoutTemplate() {
            var _this5 = this;

            this._layoutTemplates = createLayoutTemplates(this._polygon.options.get('labelLayout'), this._polygon.options.get('labelDotLayout'));

            _utilObjectKeys(this._layoutTemplates).forEach(function (type) {
                _this5._placemark[type].options.set(_this5._layoutTemplates[type]);
            });
        };

        Label.prototype.setNewOptions = function setNewOptions(newOptions) {
            var _this6 = this;

            ['dot', 'label'].forEach(function (type) {
                _this6._placemark[type].options.set(newOptions);
            });
        };

        Label.prototype.setCoordinates = function setCoordinates(coords) {
            var _this7 = this;

            if (coords.toString() !== this._placemark.label.geometry.getCoordinates().toString()) {
                ['dot', 'label'].forEach(function (type) {
                    _this7._placemark[type].geometry.setCoordinates(coords);
                });
            }
        };

        Label.prototype.setVisibilityForce = function setVisibilityForce(visibleType) {
            var _this8 = this;

            _utilObjectKeys(this._placemark).forEach(function (type) {
                var pane = type === visibleType ? 'places' : 'phantom';
                if (_this8._placemark[type].options.get('pane') !== pane) {
                    _this8._placemark[type].options.set({ pane: pane });
                }
            });
        };

        Label.prototype.setVisibility = function setVisibility(visibleState, visible, dotVisible) {
            var currState = visibleState && visibleState !== 'auto' ? visibleState : visible;
            if (currState === 'dot' && !dotVisible) {
                currState = 'none';
            }

            this.setVisibilityForce(currState);
            return currState;
        };

        Label.prototype.setStyles = function setStyles(data) {
            this._placemark.label.options.set({
                iconLabelClassName: data.className,
                iconLabelTextSize: data.textSize,
                iconLabelTextColor: data.textColor
            });
        };

        Label.prototype.setCenterAndIconShape = function setCenterAndIconShape(type, size, offset) {
            var h = size.height / 2;
            var w = size.width / 2;

            this._placemark[type].options.set({
                iconShape: {
                    type: 'Rectangle',
                    coordinates: [[-w + offset[0], -h + offset[1]], [w + offset[0], h + offset[1]]]
                },
                iconLabelLeft: -w + offset[0],
                iconLabelTop: -h + offset[1]
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

ymaps.modules.define('src.label.GeoObjectCollection.LabelData', ['util.objectKeys', 'src.config', 'src.util.zoom.parseZoomData', 'src.util.getPolesOfInaccessibility', 'src.util.zoom.setZoomVisibility'], function (_provide, _utilObjectKeys, CONFIG, parseZoomData, getPolylabelCenter, setZoomVisibility) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;

    var LabelData = function () {
        function LabelData(polygon, options, zoomRangeOptions, map, label) {
            _classCallCheck(this, LabelData);

            this._map = map;
            this._label = label;
            this._polygon = polygon;
            this._data = {
                zoomInfo: {}, // Объект с информацией для каждого зума
                autoCenter: [0, 0],
                polygonIndex: 0,
                dotVisible: typeof options.labelDotVisible !== 'boolean' ? true : options.labelDotVisible
            };
            this.parsedOptions = this._parseOptions(zoomRangeOptions);
            this._init();
        }

        LabelData.prototype.setData = function setData(key, val) {
            this._data[key] = val;
        };

        LabelData.prototype.getData = function getData(key) {
            return this._data[key];
        };

        LabelData.prototype.setZoomInfo = function setZoomInfo(zoom, key, value) {
            this._data.zoomInfo[zoom][key] = value;
        };

        LabelData.prototype.getZoomInfo = function getZoomInfo(zoom) {
            if (zoom || typeof zoom === 'number' && zoom === 0) {
                return this._data.zoomInfo[zoom];
            }
            return this._data.zoomInfo;
        };

        LabelData.prototype.getPolygonCoords = function getPolygonCoords() {
            return this._polygon.geometry.getCoordinates()[this._data.polygonIndex];
        };

        LabelData.prototype.getCenterCoords = function getCenterCoords(zoom) {
            return this.parsedOptions.labelCenterCoords && this.parsedOptions.labelCenterCoords[zoom] || this._data.autoCenter;
        };

        LabelData.prototype.getStyles = function getStyles(zoom) {
            return {
                className: this.parsedOptions.labelClassName && this.parsedOptions.labelClassName[zoom],
                textSize: this.parsedOptions.labelTextSize && this.parsedOptions.labelTextSize[zoom],
                textColor: this.parsedOptions.labelTextColor && this.parsedOptions.labelTextColor[zoom]
            };
        };

        LabelData.prototype.getVisibility = function getVisibility(zoom) {
            return this.parsedOptions.labelForceVisible && this.parsedOptions.labelForceVisible[zoom] || this._data.zoomInfo[zoom].visible;
        };

        LabelData.prototype.getOffset = function getOffset(zoom) {
            return this.parsedOptions.labelOffset && this.parsedOptions.labelOffset[zoom] || [0, 0];
        };

        LabelData.prototype.getPermissibleInaccuracyOfVisibility = function getPermissibleInaccuracyOfVisibility(zoom) {
            return this.parsedOptions.labelPermissibleInaccuracyOfVisibility && this.parsedOptions.labelPermissibleInaccuracyOfVisibility[zoom] || 0;
        };

        LabelData.prototype.getSize = function getSize(zoom, type) {
            return this._data.zoomInfo[zoom][type + 'Size'];
        };

        LabelData.prototype.setVisible = function setVisible(zoom, type, layout) {
            if (this._data.zoomInfo[zoom][type + 'Size']) return;

            var zoomData = setZoomVisibility(type, this._map, zoom, this._data.zoomInfo[zoom].visible, layout, this.getCenterCoords(zoom), this.getPolygonCoords(), this.getOffset(zoom), this.getPermissibleInaccuracyOfVisibility(zoom));
            if (!zoomData) return;

            this._data.zoomInfo[zoom].visible = zoomData.visible;
            this._data.zoomInfo[zoom][type + 'Size'] = zoomData.size;
        };

        LabelData.prototype._init = function _init() {
            var autoCenterData = getPolylabelCenter(this._polygon.geometry.getCoordinates(), 1.0);
            this._data.autoCenter = autoCenterData.center;
            this._data.polygonIndex = autoCenterData.index;

            for (var z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
                this._data.zoomInfo[z] = this._fillZoom(z);
            }
        };

        LabelData.prototype._fillZoom = function _fillZoom(zoom) {
            return this._createDefaultZoomInfo();
        };

        LabelData.prototype._parseOptions = function _parseOptions(options) {
            var result = {};
            _utilObjectKeys(options).forEach(function (key) {
                result[key] = parseZoomData(options[key]);
            });
            return result;
        };

        LabelData.prototype._createDefaultZoomInfo = function _createDefaultZoomInfo() {
            return {
                visible: 'none', // label | dot | none,
                dotSize: undefined,
                labelSize: undefined
            };
        };

        return LabelData;
    }();

    _provide(LabelData);
});
//# sourceMappingURL=LabelData.js.map

ymaps.modules.define('src.label.ObjectManager.Label', ['util.extend', 'util.objectKeys', 'src.label.util.LabelPlacemarkOverlay', 'src.label.util.LabelData', 'src.label.util.layoutTemplates.getBaseLayoutTemplates', 'src.label.util.layoutTemplates.createLayoutTemplates'], function (_provide, _utilExtend, _utilObjectKeys, LabelPlacemarkOverlay, LabelData, getBaseLayoutTemplates, createLayoutTemplates) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var Label = function () {
        function Label(map, polygon, objectManager) {
            _classCallCheck(this, Label);

            this._map = map;
            this._polygon = polygon;
            this._objectManager = objectManager;
            this._placemark = {
                label: null,
                dot: null
            };
            this._layout = {
                label: null,
                dot: null
            };
            this._baseLayoutTemplates = null;
            this._layoutTemplates = null;
            this._init();
        }

        Label.prototype.destroy = function destroy() {
            this.removeFromObjectManager();
        };

        Label.prototype.getPlacemark = function getPlacemark(type) {
            return this._placemark[type];
        };

        Label.prototype.getLayout = function getLayout(type) {
            return this._layout[type];
        };

        Label.prototype.addToObjectManager = function addToObjectManager() {
            var _this = this;

            ['label', 'dot'].forEach(function (type) {
                _this._objectManager.add(_this._placemark[type]);
            });
        };

        Label.prototype.removeFromObjectManager = function removeFromObjectManager() {
            var _this2 = this;

            ['label', 'dot'].forEach(function (type) {
                _this2._objectManager.remove(_this2._placemark[type]);
            });
            this._polygon = null;
            this._objectManager = null;
            this._placemark = null;
            this._layout = null;
            this._data = null;
        };

        Label.prototype._init = function _init() {
            this._baseLayoutTemplates = getBaseLayoutTemplates();
            this._layoutTemplates = createLayoutTemplates(this._polygon.options.labelLayout, this._polygon.options.labelDotLayout);
        };

        Label.prototype.createPlacemarks = function createPlacemarks() {
            var _this3 = this;

            ['label', 'dot'].forEach(function (type) {
                _this3._placemark[type] = Label._createPlacemark(type + '#' + _this3._polygon.id, {
                    properties: _utilExtend({}, {
                        polygon: _this3._polygon
                    }, _this3._polygon.properties),
                    options: _utilExtend({}, _this3._polygon.options, _this3._layoutTemplates[type])
                }, _this3._baseLayoutTemplates[type], _this3._data.getCenterCoords(_this3._map.getZoom()));
            });
        };

        Label._createPlacemark = function _createPlacemark(id, params, layout, coordinates) {
            var options = _utilExtend({}, {
                iconLayout: layout,
                iconLabelPosition: 'absolute',
                overlay: LabelPlacemarkOverlay,
                pane: 'phantom'
            }, params.options);
            return {
                type: 'Feature',
                id: id,
                options: options,
                properties: params.properties,
                geometry: {
                    type: 'Point',
                    coordinates: coordinates
                }
            };
        };

        Label.prototype._updateOptions = function _updateOptions(id, options) {
            this._objectManager.objects.setObjectOptions(id, options);
        };

        Label.prototype.createLabelData = function createLabelData(options, zoomRangeOptions) {
            this._data = new LabelData(this._polygon, options, zoomRangeOptions, this._map, this);
            return this._data;
        };

        Label.prototype.getLabelData = function getLabelData() {
            return this._data;
        };

        Label.prototype.setLayout = function setLayout(type, layout) {
            this._layout[type] = layout;
        };

        Label.prototype.setLayoutTemplate = function setLayoutTemplate() {
            var _this4 = this;

            this._layoutTemplates = createLayoutTemplates(this._polygon.options.labelLayout, this._polygon.options.labelDotLayout);

            _utilObjectKeys(this._layoutTemplates).forEach(function (type) {
                _this4._updateOptions(_this4._placemark[type].id, _this4._layoutTemplates[type]);
            });
        };

        Label.prototype.setNewOptions = function setNewOptions(newOptions) {
            var _this5 = this;

            ['dot', 'label'].forEach(function (type) {
                _utilExtend(_this5._placemark[type].options, newOptions);
                _this5._updateOptions(_this5._placemark[type].id, _this5._placemark[type].options);
            });
        };

        Label.prototype.setDataByZoom = function setDataByZoom(zoom, types, visibleState) {
            var _this6 = this;

            types.forEach(function (type) {
                if (type === 'label') {
                    var styles = _this6._data.getStyles(zoom);
                    _this6.setStyles({
                        className: styles.className,
                        textSize: styles.textSize,
                        textColor: styles.textColor
                    });
                }
                _this6._data.setVisible(zoom, type, _this6._layout[type]);
            });

            var currentVisibleType = this.setVisibility(visibleState, this._data.getVisibility(zoom), this._data.getData('dotVisible'));

            if (['label', 'dot'].indexOf(currentVisibleType) !== -1 && this._data.getSize(zoom, currentVisibleType)) {
                this.setCoordinates(this._data.getCenterCoords(zoom));
                this.setCenterAndIconShape(currentVisibleType, this._data.getSize(zoom, currentVisibleType), this._data.getOffset(zoom));
            }

            return {
                currentVisibleType: currentVisibleType,
                currentConfiguredVisibileType: this._data.getVisibility(zoom)
            };
        };

        Label.prototype.setCenterAndIconShape = function setCenterAndIconShape(type, size, offset) {
            var h = size.height / 2;
            var w = size.width / 2;

            this._updateOptions(this._placemark[type].id, {
                iconShape: {
                    type: 'Rectangle',
                    coordinates: [[-w + offset[0], -h + offset[1]], [w + offset[0], h + offset[1]]]
                },
                iconLabelLeft: -w + offset[0],
                iconLabelTop: -h + offset[1]
            });
        };

        Label.prototype.setCoordinates = function setCoordinates(coords) {
            var _this7 = this;

            if (coords.toString() !== this._placemark.label.geometry.coordinates.toString()) {
                ['dot', 'label'].forEach(function (type) {
                    _this7._objectManager.remove(_this7._placemark[type]);
                    _this7._generateNewPlacemark(type);
                    _this7._placemark[type].geometry.coordinates = coords;
                    _this7._objectManager.add(_this7._placemark[type]);
                });
            }
        };

        Label.prototype.setStyles = function setStyles(data) {
            this._updateOptions(this._placemark.label.id, {
                iconLabelClassName: data.className,
                iconLabelTextSize: data.textSize,
                iconLabelTextColor: data.textColor
            });
        };

        Label.prototype.setVisibilityForce = function setVisibilityForce(visibleType) {
            var _this8 = this;

            _utilObjectKeys(this._placemark).forEach(function (type) {
                var pane = type === visibleType ? 'places' : 'phantom';
                var label = _this8._objectManager.objects.getById(_this8._placemark[type].id);
                if (label && label.options.pane !== pane) {
                    _this8._updateOptions(_this8._placemark[type].id, { pane: pane });
                }
            });
        };

        Label.prototype.setVisibility = function setVisibility(visibleState, visible, dotVisible) {
            var currState = visibleState && visibleState !== 'auto' ? visibleState : visible;
            if (currState === 'dot' && !dotVisible) {
                currState = 'none';
            }

            this.setVisibilityForce(currState);
            return currState;
        };

        Label.prototype._generateNewPlacemark = function _generateNewPlacemark(type) {
            this._placemark[type] = _utilExtend({}, this._placemark[type]);
            var id = this._placemark[type].id;
            this._placemark[type].id = id[0] === '_' ? id.slice(1) : '_' + id;
        };

        return Label;
    }();

    _provide(Label);
});
//# sourceMappingURL=Label.js.map

ymaps.modules.define('src.label.ObjectManager.LabelData', ['util.objectKeys', 'src.config', 'src.util.zoom.parseZoomData', 'src.util.getPolesOfInaccessibility', 'src.util.zoom.setZoomVisibility'], function (_provide, _utilObjectKeys, CONFIG, parseZoomData, getPolylabelCenter, setZoomVisibility) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;

    var LabelData = function () {
        function LabelData(polygon, options, zoomRangeOptions, map, label) {
            _classCallCheck(this, LabelData);

            this._map = map;
            this._label = label;
            this._polygon = polygon;
            this._data = {
                zoomInfo: {}, // Объект с информацией для каждого зума
                autoCenter: [0, 0],
                polygonIndex: 0,
                dotVisible: typeof options.labelDotVisible !== 'boolean' ? true : options.labelDotVisible
            };
            this.parsedOptions = this._parseOptions(zoomRangeOptions);
            this._init();
        }

        LabelData.prototype.setData = function setData(key, val) {
            this._data[key] = val;
        };

        LabelData.prototype.getData = function getData(key) {
            return this._data[key];
        };

        LabelData.prototype.setZoomInfo = function setZoomInfo(zoom, key, value) {
            this._data.zoomInfo[zoom][key] = value;
        };

        LabelData.prototype.getZoomInfo = function getZoomInfo(zoom) {
            if (zoom || typeof zoom === 'number' && zoom === 0) {
                return this._data.zoomInfo[zoom];
            }
            return this._data.zoomInfo;
        };

        LabelData.prototype.getPolygonCoords = function getPolygonCoords() {
            return this._polygon.geometry.coordinates[this._data.polygonIndex];
        };

        LabelData.prototype.getCenterCoords = function getCenterCoords(zoom) {
            return this.parsedOptions.labelCenterCoords && this.parsedOptions.labelCenterCoords[zoom] || this._data.autoCenter;
        };

        LabelData.prototype.getStyles = function getStyles(zoom) {
            return {
                className: this.parsedOptions.labelClassName && this.parsedOptions.labelClassName[zoom],
                textSize: this.parsedOptions.labelTextSize && this.parsedOptions.labelTextSize[zoom],
                textColor: this.parsedOptions.labelTextColor && this.parsedOptions.labelTextColor[zoom]
            };
        };

        LabelData.prototype.getVisibility = function getVisibility(zoom) {
            return this.parsedOptions.labelForceVisible && this.parsedOptions.labelForceVisible[zoom] || this._data.zoomInfo[zoom].visible;
        };

        LabelData.prototype.getOffset = function getOffset(zoom) {
            return this.parsedOptions.labelOffset && this.parsedOptions.labelOffset[zoom] || [0, 0];
        };

        LabelData.prototype.getPermissibleInaccuracyOfVisibility = function getPermissibleInaccuracyOfVisibility(zoom) {
            return this.parsedOptions.labelPermissibleInaccuracyOfVisibility && this.parsedOptions.labelPermissibleInaccuracyOfVisibility[zoom] || 0;
        };

        LabelData.prototype.getSize = function getSize(zoom, type) {
            return this._data.zoomInfo[zoom][type + 'Size'];
        };

        LabelData.prototype.setVisible = function setVisible(zoom, type, layout) {
            if (this._data.zoomInfo[zoom][type + 'Size']) return;

            var zoomData = setZoomVisibility(type, this._map, zoom, this._data.zoomInfo[zoom].visible, layout, this.getCenterCoords(zoom), this.getPolygonCoords(), this.getOffset(zoom), this.getPermissibleInaccuracyOfVisibility(zoom));
            if (!zoomData) return;

            this._data.zoomInfo[zoom].visible = zoomData.visible;
            this._data.zoomInfo[zoom][type + 'Size'] = zoomData.size;
        };

        LabelData.prototype._init = function _init() {
            var autoCenterData = getPolylabelCenter(this._polygon.geometry.coordinates, 1.0);
            this._data.autoCenter = autoCenterData.center;
            this._data.polygonIndex = autoCenterData.index;

            for (var z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
                this._data.zoomInfo[z] = this._fillZoom(z);
            }
        };

        LabelData.prototype._fillZoom = function _fillZoom(zoom) {
            return this._createDefaultZoomInfo();
        };

        LabelData.prototype._parseOptions = function _parseOptions(options) {
            var result = {};
            _utilObjectKeys(options).forEach(function (key) {
                result[key] = parseZoomData(options[key]);
            });
            return result;
        };

        LabelData.prototype._createDefaultZoomInfo = function _createDefaultZoomInfo() {
            return {
                visible: 'none', // label | dot | none,
                dotSize: undefined,
                labelSize: undefined
            };
        };

        return LabelData;
    }();

    _provide(LabelData);
});
//# sourceMappingURL=LabelData.js.map

ymaps.modules.define("src.label.util.getLayoutSize", [], function (_provide) {
    _provide(function (layout) {
        var el = layout && layout.getElement();
        if (!el) {
            return;
        }
        var width = 0;
        var height = 0;

        while (width === 0 && height === 0) {
            el = el.children[0];
            if (!el) break;
            var rect = el.getBoundingClientRect();
            width = rect.width;
            height = rect.height;
        }
        return { width: width, height: height };
    });
});
//# sourceMappingURL=getLayoutSize.js.map

ymaps.modules.define('src.label.util.LabelData', ['util.objectKeys', 'src.config', 'src.util.zoom.parseZoomData', 'src.util.getPolesOfInaccessibility', 'src.util.zoom.setZoomVisibility', 'GeoObject'], function (_provide, _utilObjectKeys, CONFIG, parseZoomData, getPolylabelCenter, setZoomVisibility, GeoObject) {
    function _classCallCheck(instance, Constructor) {
        if (!(instance instanceof Constructor)) {
            throw new TypeError("Cannot call a class as a function");
        }
    }

    var MIN_ZOOM = CONFIG.MIN_ZOOM,
        MAX_ZOOM = CONFIG.MAX_ZOOM;

    var LabelData = function () {
        function LabelData(polygon, options, zoomRangeOptions, map, label) {
            _classCallCheck(this, LabelData);

            this._map = map;
            this._label = label;
            this._polygon = polygon;
            this._data = {
                zoomInfo: {}, // Объект с информацией для каждого зума
                autoCenter: [0, 0],
                polygonIndex: 0,
                dotVisible: typeof options.labelDotVisible !== 'boolean' ? true : options.labelDotVisible
            };
            this.parsedOptions = this._parseOptions(zoomRangeOptions);
            this._init();
        }

        LabelData.prototype.setData = function setData(key, val) {
            this._data[key] = val;
        };

        LabelData.prototype.getData = function getData(key) {
            return this._data[key];
        };

        LabelData.prototype.setZoomInfo = function setZoomInfo(zoom, key, value) {
            this._data.zoomInfo[zoom][key] = value;
        };

        LabelData.prototype.getZoomInfo = function getZoomInfo(zoom) {
            if (zoom || typeof zoom === 'number' && zoom === 0) {
                return this._data.zoomInfo[zoom];
            }
            return this._data.zoomInfo;
        };

        LabelData.prototype.getPolygonCoords = function getPolygonCoords() {
            return this._polygon instanceof GeoObject ? this._polygon.geometry.getCoordinates()[this._data.polygonIndex] : this._polygon.geometry.coordinates[this._data.polygonIndex];
        };

        LabelData.prototype.getCenterCoords = function getCenterCoords(zoom) {
            return this.parsedOptions.labelCenterCoords && this.parsedOptions.labelCenterCoords[zoom] || this._data.autoCenter;
        };

        LabelData.prototype.getStyles = function getStyles(zoom) {
            return {
                className: this.parsedOptions.labelClassName && this.parsedOptions.labelClassName[zoom],
                textSize: this.parsedOptions.labelTextSize && this.parsedOptions.labelTextSize[zoom],
                textColor: this.parsedOptions.labelTextColor && this.parsedOptions.labelTextColor[zoom]
            };
        };

        LabelData.prototype.getVisibility = function getVisibility(zoom) {
            return this.parsedOptions.labelForceVisible && this.parsedOptions.labelForceVisible[zoom] || this._data.zoomInfo[zoom].visible;
        };

        LabelData.prototype.getOffset = function getOffset(zoom) {
            return this.parsedOptions.labelOffset && this.parsedOptions.labelOffset[zoom] || [0, 0];
        };

        LabelData.prototype.getPermissibleInaccuracyOfVisibility = function getPermissibleInaccuracyOfVisibility(zoom) {
            return this.parsedOptions.labelPermissibleInaccuracyOfVisibility && this.parsedOptions.labelPermissibleInaccuracyOfVisibility[zoom] || 0;
        };

        LabelData.prototype.getSize = function getSize(zoom, type) {
            return this._data.zoomInfo[zoom][type + 'Size'];
        };

        LabelData.prototype.setVisible = function setVisible(zoom, type, layout) {
            if (this._data.zoomInfo[zoom][type + 'Size']) return;

            var zoomData = setZoomVisibility(type, this._map, zoom, this._data.zoomInfo[zoom].visible, layout, this.getCenterCoords(zoom), this.getPolygonCoords(), this.getOffset(zoom), this.getPermissibleInaccuracyOfVisibility(zoom));
            if (!zoomData) return;

            this._data.zoomInfo[zoom].visible = zoomData.visible;
            this._data.zoomInfo[zoom][type + 'Size'] = zoomData.size;
        };

        LabelData.prototype._init = function _init() {
            var coordinates = this._polygon instanceof GeoObject ? this._polygon.geometry.getCoordinates() : this._polygon.geometry.coordinates;

            var autoCenterData = getPolylabelCenter(coordinates, 1.0);
            this._data.autoCenter = autoCenterData.center;
            this._data.polygonIndex = autoCenterData.index;

            for (var z = MIN_ZOOM; z <= MAX_ZOOM; z++) {
                this._data.zoomInfo[z] = this._fillZoom(z);
            }
        };

        LabelData.prototype._fillZoom = function _fillZoom(zoom) {
            return this._createDefaultZoomInfo();
        };

        LabelData.prototype._parseOptions = function _parseOptions(options) {
            var result = {};
            _utilObjectKeys(options).forEach(function (key) {
                result[key] = parseZoomData(options[key]);
            });
            return result;
        };

        LabelData.prototype._createDefaultZoomInfo = function _createDefaultZoomInfo() {
            return {
                visible: 'none', // label | dot | none,
                dotSize: undefined,
                labelSize: undefined
            };
        };

        return LabelData;
    }();

    _provide(LabelData);
});
//# sourceMappingURL=LabelData.js.map

ymaps.modules.define('src.label.util.LabelPlacemarkOverlay', ['util.defineClass', 'overlay.Placemark', 'GeoObject'], function (_provide, _utilDefineClass, overlayPlacemark, GeoObject) {
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
            var polygon = this._data.geoObject instanceof GeoObject ? this._data.geoObject.properties.get('polygon') : this._data.properties.polygon;

            return {
                geoObject: polygon,
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

ymaps.modules.define('src.label.util.layoutTemplates.createLayoutTemplates', ['templateLayoutFactory'], function (_provide, templateLayoutFactory) {

    var dotDefault = '<div {% style %}background-color: red;\nwidth: 10px; height: 10px; border-radius: 50px;{% endstyle %}></div>';

    /**
     * Создает пользовательские шаблоны
     */

    _provide(function (labelLayout, labelDotLayout) {
        return {
            label: {
                iconLabelTemplateLayout: templateLayoutFactory.createClass(labelLayout)
            },
            dot: {
                iconLabelDotTemplateLayout: templateLayoutFactory.createClass(labelDotLayout || dotDefault)
            }
        };
    });
});
//# sourceMappingURL=createLayoutTemplates.js.map

ymaps.modules.define('src.label.util.layoutTemplates.dotLayoutTemplate', ['templateLayoutFactory'], function (_provide, templateLayoutFactory) {

    var defaultDotTemplate = '<div {% style %}background-color: red;\n    width: 10px; height: 10px; border-radius: 50px;{% endstyle %}></div>';

    var template = templateLayoutFactory.createClass('\n    <div {% style %}position: {{options.labelPosition}};\n        top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>\n            {% include options.labelDotTemplateLayout %}\n        </div>');

    _provide(template);
});
//# sourceMappingURL=dotLayoutTemplate.js.map

ymaps.modules.define('src.label.util.layoutTemplates.getBaseLayoutTemplates', ['src.label.util.layoutTemplates.labelLayoutTemplate', 'src.label.util.layoutTemplates.dotLayoutTemplate'], function (_provide, labelLayoutTemplate, dotLayoutTemplate) {
    _provide(function () {
        return {
            label: labelLayoutTemplate,
            dot: dotLayoutTemplate
        };
    });
});
//# sourceMappingURL=getBaseLayoutTemplates.js.map

ymaps.modules.define('src.label.util.layoutTemplates.labelLayoutTemplate', ['templateLayoutFactory'], function (_provide, templateLayoutFactory) {

    var template = templateLayoutFactory.createClass('\n    <div {% style %}position: {{options.labelPosition}};\n        top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>\n        <div class="{{options.labelClassName}}"\n            {% style %}text-align: center; font-size: {{options.labelTextSize}}px;\n            color: {{options.labelTextColor}}; {% endstyle %}>\n                {% include options.labelTemplateLayout %}\n            </div>\n        </div>');

    _provide(template);
});
//# sourceMappingURL=labelLayoutTemplate.js.map

ymaps.modules.define('src.polylabel.PolylabelBase', ['src.config', 'GeoObject'], function (_provide, CONFIG, GeoObject) {
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
            this._map.events.add(['boundschange', 'dblclick'], this._mapEventsHandler, this);
        };

        PolylabelBased.prototype.destroyMapListeners = function destroyMapListeners() {
            this._map.events.remove(['boundschange', 'dblclick'], this._mapEventsHandler, this);
        };

        PolylabelBased.prototype._mapEventsHandler = function _mapEventsHandler(event) {
            switch (event.get('type')) {
                case 'boundschange':
                    {
                        if (event.get('newZoom') !== event.get('oldZoom')) {
                            this._mapBoundsChangeCallback('boundschange');
                        }
                        break;
                    }
                case 'dblclick':
                    {
                        this._mapBoundsChangeCallback('dblclick');
                    }
            }
        };

        PolylabelBased.prototype.getOptions = function getOptions(obj) {
            return CONFIG.options.reduce(function (result, key) {
                result[key] = obj instanceof GeoObject ? obj.options.get(key) : obj.options[key];
                return result;
            }, {});
        };

        PolylabelBased.prototype.getZoomRangeOptions = function getZoomRangeOptions(obj) {
            return CONFIG.zoomRangeOptions.reduce(function (result, key) {
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
//# sourceMappingURL=PolylabelBase.js.map

ymaps.modules.define('src.polylabel.PolylabelCollection', ['util.defineClass', 'src.polylabel.PolylabelBase', 'src.label.GeoObjectCollection.Label', 'GeoObjectCollection', 'Monitor', 'system.nextTick', 'data.Manager', 'event.Manager', 'Event'], function (_provide, _utilDefineClass, PBase, Label, GeoObjectCollection, Monitor, nextTick, DataManager, EventManager, Event) {
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

    var PolylabelCollection = function (_PBase) {
        _utilDefineClass(PolylabelCollection, _PBase);

        function PolylabelCollection(map, polygonsCollection) {
            _classCallCheck(this, PolylabelCollection);

            var _this = _possibleConstructorReturn(this, _PBase.call(this, map));

            _this._map = map;
            _this._labelsCollection = new GeoObjectCollection();
            _this._labelsState = new WeakMap();
            _this._polygonsCollection = polygonsCollection;
            _this._currentConfiguredVisibility = new WeakMap();
            _this._currentVisibility = new WeakMap();
            _this._isPolygonParentChange = new WeakMap();
            _this._init();
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

        PolylabelCollection.prototype._init = function _init() {
            var _this2 = this;

            this._map.geoObjects.add(this._labelsCollection);
            this._firstCalculatePolygons().then(function () {
                _this2._initMapListeners();
                _this2._initPolygonCollectionListeners();
                _this2._initPolygonsListeners();
                _this2._initLabelCollectionListeners();
            });
        };

        PolylabelCollection.prototype._firstCalculatePolygons = function _firstCalculatePolygons() {
            var _this3 = this;

            this._clearLabelCollection();
            this._polygonsCollection.each(function (polygon) {
                _this3._calculateNewPolygon(polygon).then(function (label) {
                    _this3._analyzeAndSetLabelData(polygon, label);
                });
            });
            return Promise.resolve();
        };

        PolylabelCollection.prototype._calculatePolygons = function _calculatePolygons() {
            var _this4 = this;

            var promises = [];
            this._polygonsCollection.each(function (polygon) {
                if (polygon.geometry.getType() === 'Polygon') {
                    var label = _this4._getFromLabelState(polygon, 'label');
                    if (label) promises.push(_this4._analyzeAndSetLabelData(polygon, label));
                }
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
                var label = _this5._getFromLabelState(polygon, 'label');
                if (label) label.destroy();
            });
            this._clearLabelCollection();
        };

        PolylabelCollection.prototype._calculatePolygonLabelData = function _calculatePolygonLabelData(polygon, isLabelCreated) {
            var options = this.getOptions(polygon);
            var zoomRangeOptions = this.getZoomRangeOptions(polygon);

            var label = isLabelCreated ? this._getFromLabelState(polygon, 'label') : new Label(this._map, polygon, this._labelsCollection);
            label.createLabelData(options, zoomRangeOptions);

            return Promise.resolve(label);
        };

        PolylabelCollection.prototype._analyzeAndSetLabelData = function _analyzeAndSetLabelData(polygon, label, visibleState) {
            var _this6 = this;

            return new Promise(function (resolve) {
                nextTick(function () {
                    var data = label.setDataByZoom(_this6._map.getZoom(), visibleState);
                    _this6._setCurrentConfiguredVisibility(polygon, data.currentConfiguredVisibileType);
                    _this6._setCurrentVisibility(polygon, data.currentVisibleType);
                    resolve();
                });
            });
        };

        PolylabelCollection.prototype._setCurrentConfiguredVisibility = function _setCurrentConfiguredVisibility(polygon, type) {
            this._currentConfiguredVisibility.set(polygon, type);
        };

        PolylabelCollection.prototype._setCurrentVisibility = function _setCurrentVisibility(polygon, type) {
            this._currentVisibility.set(polygon, ['dot', 'label'].indexOf(type) !== -1 ? type : 'none');
        };

        PolylabelCollection.prototype._calculateNewPolygon = function _calculateNewPolygon(polygon) {
            var _this7 = this;

            return new Promise(function (resolve) {
                if (polygon.geometry.getType() === 'Polygon') {
                    _this7._calculatePolygonLabelData(polygon).then(function (label) {
                        _this7._setInLabelState(polygon, 'label', label);
                        _this7._initLabelStateListener(polygon);
                        label.createPlacemarks();
                        label.addToCollection().then(function () {
                            resolve(label);
                        });
                    });
                }
            });
        };

        PolylabelCollection.prototype._setInLabelState = function _setInLabelState(polygon, key, value) {
            var labelState = this._labelsState.get(polygon);
            if (!labelState) {
                labelState = new DataManager();
                this._labelsState.set(polygon, labelState);
            }
            labelState.set(key, value);
        };

        PolylabelCollection.prototype._getFromLabelState = function _getFromLabelState(polygon, key) {
            var labelState = this._labelsState.get(polygon);
            if (labelState) {
                return labelState.get(key);
            }
        };

        PolylabelCollection.prototype._clearVisibilityInLabelsState = function _clearVisibilityInLabelsState(value) {
            var _this8 = this;

            this._polygonsCollection.each(function (polygon) {
                _this8._setInLabelState(polygon, 'visible', value);
            });
        };

        PolylabelCollection.prototype._initLabelStateListener = function _initLabelStateListener(polygon) {
            var _this9 = this;

            var monitor = new Monitor(this._labelsState.get(polygon));
            this._setInLabelState(polygon, 'labelMonitor', monitor);
            monitor.add('visible', function (newValue) {
                setTimeout(function () {
                    if (_this9._dblClick) {
                        _this9._dblClick = false;
                        return;
                    }
                    _this9._analyzeAndSetLabelData(polygon, _this9._getFromLabelState(polygon, 'label'), newValue);
                }, 100);
            });
        };

        PolylabelCollection.prototype._initPolygonsListeners = function _initPolygonsListeners() {
            var _this10 = this;

            this._polygonsCollection.each(function (polygon) {
                _this10._initPolygonListener(polygon);
            });
        };

        PolylabelCollection.prototype._initPolygonListener = function _initPolygonListener(polygon) {
            if (polygon.geometry.getType() === 'Polygon') {
                polygon.events.add(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
                polygon.events.add('parentchange', this._onPolygonParentChangeHandler, this);
            }
        };

        PolylabelCollection.prototype._onPolygonParentChangeHandler = function _onPolygonParentChangeHandler(event) {
            this._isPolygonParentChange.set(event.get('target'), 2);
            // 2 - это кол-во событий, которые слушаем ['optionschange', 'propertieschange']
            // Это необходимо, чтобы при удалении полигона в _onPolygonOptionsChangeHandler
            // не происходило присваивание опций пустой подписи,
            // тк при удалении объекта из коллекции у него меняются все опции
        };

        PolylabelCollection.prototype._onPolygonOptionsChangeHandler = function _onPolygonOptionsChangeHandler(event) {
            var _this11 = this;

            var polygon = event.get('target');
            var label = this._getFromLabelState(polygon, 'label');

            var curr = this._isPolygonParentChange.get(polygon);
            if (curr > 0 || !label) {
                this._isPolygonParentChange.set(event.get('target'), curr - 1);
                return;
            }

            label.setVisibilityForce('none');
            label.setLayoutTemplate();

            this._calculatePolygonLabelData(polygon, true).then(function (label) {
                _this11._setInLabelState(polygon, 'label', label);
                _this11._analyzeAndSetLabelData(polygon, label);
            });
        };

        PolylabelCollection.prototype._initPolygonCollectionListeners = function _initPolygonCollectionListeners() {
            this._polygonsCollection.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
        };

        PolylabelCollection.prototype._polygonCollectionEventHandler = function _polygonCollectionEventHandler(event) {
            var _this12 = this;

            switch (event.get('type')) {
                case 'add':
                    {
                        var polygon = event.get('child');
                        this._calculateNewPolygon(polygon).then(function (label) {
                            _this12._analyzeAndSetLabelData(polygon, label);
                        });
                        break;
                    }
                case 'remove':
                    {
                        this._deleteLabelStateListener(event.get('child'));
                        var label = this._getFromLabelState(event.get('child'), 'label');
                        if (label) label.destroy();
                        break;
                    }
            }
        };

        PolylabelCollection.prototype._initLabelCollectionListeners = function _initLabelCollectionListeners() {
            var controller = {
                onBeforeEventFiring: function onBeforeEventFiring(events, type, event) {
                    if (event.get('target').options.get('pane') === 'phantom') return false;

                    var polygon = event.get('target').properties.get('polygon');
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

            this.initMapListeners(function (type) {
                if (type === 'dblclick') {
                    _this13._dblClick = true;
                }
                if (type === 'boundschange') {
                    _this13._clearVisibilityInLabelsState();
                    _this13._calculatePolygons();
                }
            });
        };

        PolylabelCollection.prototype._deleteLabelStateListeners = function _deleteLabelStateListeners() {
            var _this14 = this;

            this._polygonsCollection.each(function (polygon) {
                _this14._deleteLabelStateListener(polygon);
            });
        };

        PolylabelCollection.prototype._deleteLabelStateListener = function _deleteLabelStateListener(polygon) {
            var monitor = this._getFromLabelState(polygon, 'labelMonitor');
            if (monitor) {
                monitor.removeAll();
            }
        };

        PolylabelCollection.prototype._deletePolygonCollectionListeners = function _deletePolygonCollectionListeners() {
            this._polygonsCollection.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
            this.destroyMapListeners();
        };

        PolylabelCollection.prototype._deletePolygonsListeners = function _deletePolygonsListeners() {
            var _this15 = this;

            this._polygonsCollection.each(function (polygon) {
                _this15._deletePolygonListener(polygon);
            });
        };

        PolylabelCollection.prototype._deletePolygonListener = function _deletePolygonListener(polygon) {
            polygon.events.remove(['optionschange', 'propertieschange'], this._onPolygonOptionsChangeHandler, this);
            polygon.events.remove('parentchange', this._onPolygonParentChangeHandler, this);
        };

        return PolylabelCollection;
    }(PBase);

    _provide(PolylabelCollection);
});
//# sourceMappingURL=PolylabelCollection.js.map

ymaps.modules.define('src.polylabel.PolylabelObjectManager', ['util.defineClass', 'src.polylabel.PolylabelBase', 'data.Manager', 'Monitor', 'ObjectManager', 'src.label.ObjectManager.Label', 'system.nextTick', 'event.Manager'], function (_provide, _utilDefineClass, PBase, DataManager, Monitor, ObjectManager, Label, nextTick, EventManager) {
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

    var PolylabelObjectManager = function (_PBase) {
        _utilDefineClass(PolylabelObjectManager, _PBase);

        function PolylabelObjectManager(map, objectManager) {
            _classCallCheck(this, PolylabelObjectManager);

            var _this = _possibleConstructorReturn(this, _PBase.call(this, map));

            _this._map = map;
            _this._polygonsObjectManager = objectManager;
            _this._labelsObjectManager = new ObjectManager();
            _this._labelsState = new WeakMap();
            _this._currentConfiguredVisibility = new WeakMap();
            _this._currentVisibility = new WeakMap();
            _this._init();
            return _this;
        }

        PolylabelObjectManager.prototype.destroy = function destroy() {
            this._deleteLabelsOverlaysListeners();
            this._deleteLabelStateListeners();
            this._deletePolygonsListeners();
            this._deletePolygonsObjectsListeners();
            this._deleteLabelsOMListeners();
        };

        PolylabelObjectManager.prototype.getLabelState = function getLabelState(polygon) {
            return this._labelsState.get(polygon);
        };

        PolylabelObjectManager.prototype.getConfiguredVisibility = function getConfiguredVisibility(polygon) {
            return this._currentConfiguredVisibility.get(polygon);
        };

        PolylabelObjectManager.prototype.getCurrentVisibility = function getCurrentVisibility(polygon) {
            return this._currentVisibility.get(polygon);
        };

        PolylabelObjectManager.prototype._init = function _init() {
            var _this2 = this;

            this._map.geoObjects.add(this._labelsObjectManager);
            this._initLabelsOverlaysListeners();
            this._initPolygonsObjectsListeners();
            this._initPolygonsListeners();
            this._initLabelsOMListeners();

            this._calculatePolygons().then(function () {
                return _this2._initMapListeners();
            });
        };

        PolylabelObjectManager.prototype._calculatePolygons = function _calculatePolygons() {
            var _this3 = this;

            this._polygonsObjectManager.objects.each(function (polygon) {
                _this3._calculateNewPolygon(polygon);
            });
            return Promise.resolve();
        };

        PolylabelObjectManager.prototype._calculatePolygonLabelData = function _calculatePolygonLabelData(polygon, isLabelCreated) {
            var options = this.getOptions(polygon);
            var zoomRangeOptions = this.getZoomRangeOptions(polygon);

            var label = isLabelCreated ? this._getFromLabelState(polygon, 'label') : new Label(this._map, polygon, this._labelsObjectManager);

            label.createLabelData(options, zoomRangeOptions);
            return Promise.resolve(label);
        };

        PolylabelObjectManager.prototype._analyzeAndSetLabelData = function _analyzeAndSetLabelData(polygon, types, label, visibleState) {
            var data = label.setDataByZoom(this._map.getZoom(), types, visibleState);

            this._setCurrentConfiguredVisibility(polygon, data.currentConfiguredVisibileType);
            this._setCurrentVisibility(polygon, data.currentVisibleType);
        };

        PolylabelObjectManager.prototype._setCurrentConfiguredVisibility = function _setCurrentConfiguredVisibility(polygon, type) {
            this._currentConfiguredVisibility.set(polygon, type);
        };

        PolylabelObjectManager.prototype._setCurrentVisibility = function _setCurrentVisibility(polygon, type) {
            this._currentVisibility.set(polygon, ['dot', 'label'].indexOf(type) !== -1 ? type : 'none');
        };

        PolylabelObjectManager.prototype._initLabelStateListener = function _initLabelStateListener(polygon) {
            var _this4 = this;

            var monitor = new Monitor(this._labelsState.get(polygon));
            this._setInLabelState(polygon, 'labelMonitor', monitor);
            monitor.add('visible', function (newValue) {
                setTimeout(function () {
                    if (_this4._dblClick) {
                        _this4._dblClick = false;
                        return;
                    }
                    _this4._analyzeAndSetLabelData(polygon, ['dot', 'label'], _this4._getFromLabelState(polygon, 'label'), newValue);
                }, 100);
            });
        };

        PolylabelObjectManager.prototype._initLabelsOverlaysListeners = function _initLabelsOverlaysListeners() {
            this._labelsObjectManager.objects.overlays.events.add(['add', 'remove'], this._labelsOverlaysEventHandler, this);
        };

        PolylabelObjectManager.prototype._getLabelType = function _getLabelType(labelId) {
            return labelId.indexOf('label#') !== -1 ? 'label' : 'dot';
        };

        PolylabelObjectManager.prototype._labelOverlaysGeometryChangeHandler = function _labelOverlaysGeometryChangeHandler(event) {
            var _this5 = this;

            var overlay = event.get('target');
            var labelId = overlay._data.id;

            overlay.getLayout().then(function (layout) {
                var labelType = _this5._getLabelType(labelId);
                var label = _this5._labelsObjectManager.objects.getById(labelId);
                if (!label) return;

                var polygon = label.properties.polygon;
                var labelInst = _this5._getFromLabelState(polygon, 'label');
                labelInst.setLayout(labelType, layout);
                _this5._analyzeAndSetLabelData(polygon, [labelType], labelInst);
            });
        };

        PolylabelObjectManager.prototype._labelsOverlaysEventHandler = function _labelsOverlaysEventHandler(event) {
            var _this6 = this;

            var labelId = event.get('objectId');
            var labelType = this._getLabelType(labelId);
            var overlay = event.get('overlay');

            switch (event.get('type')) {
                case 'add':
                    {
                        overlay.events.add('geometrychange', this._labelOverlaysGeometryChangeHandler, this);
                        nextTick(function () {
                            overlay.getLayout().then(function (layout) {
                                var label = _this6._labelsObjectManager.objects.getById(labelId);
                                if (!label) return;

                                var polygon = label.properties.polygon;
                                var labelInst = _this6._getFromLabelState(polygon, 'label');
                                labelInst.setLayout(labelType, layout);
                                _this6._analyzeAndSetLabelData(polygon, [labelType], labelInst);
                            });
                        });
                        break;
                    }
                case 'remove':
                    {
                        overlay.events.remove('geometrychange', this._labelOverlaysGeometryChangeHandler, this);
                        break;
                    }
            }
        };

        PolylabelObjectManager.prototype._setInLabelState = function _setInLabelState(polygon, key, value) {
            var labelState = this._labelsState.get(polygon);
            if (!labelState) {
                labelState = new DataManager();
                this._labelsState.set(polygon, labelState);
            }
            labelState.set(key, value);
        };

        PolylabelObjectManager.prototype._getFromLabelState = function _getFromLabelState(polygon, key) {
            var labelState = this._labelsState.get(polygon);
            if (labelState) return labelState.get(key);
        };

        PolylabelObjectManager.prototype._clearVisibilityInLabelsState = function _clearVisibilityInLabelsState() {
            var _this7 = this;

            this._polygonsObjectManager.objects.each(function (polygon) {
                _this7._setInLabelState(polygon, 'visible', undefined);
            });
        };

        PolylabelObjectManager.prototype._initMapListeners = function _initMapListeners() {
            var _this8 = this;

            this.initMapListeners(function (type) {
                if (type === 'dblclick') {
                    _this8._dblClick = true;
                }
                if (type === 'boundschange') {
                    _this8._clearVisibilityInLabelsState();
                }
            });
        };

        PolylabelObjectManager.prototype._initPolygonsObjectsListeners = function _initPolygonsObjectsListeners() {
            this._polygonsObjectManager.objects.events.add(['add', 'remove'], this._polygonCollectionEventHandler, this);
        };

        PolylabelObjectManager.prototype._polygonCollectionEventHandler = function _polygonCollectionEventHandler(event) {
            switch (event.get('type')) {
                case 'add':
                    {
                        var polygon = event.get('child');
                        this._calculateNewPolygon(polygon);
                        break;
                    }
                case 'remove':
                    {
                        var _polygon = event.get('child');
                        var label = this._getFromLabelState(_polygon, 'label');
                        if (label) label.destroy();
                        break;
                    }
            }
        };

        PolylabelObjectManager.prototype._calculateNewPolygon = function _calculateNewPolygon(polygon) {
            var _this9 = this;

            if (polygon.geometry.type === 'Polygon') {
                this._calculatePolygonLabelData(polygon).then(function (label) {
                    _this9._setInLabelState(polygon, 'label', label);
                    _this9._initLabelStateListener(polygon);
                    label.createPlacemarks();
                    label.addToObjectManager();
                });
            }
        };

        PolylabelObjectManager.prototype._initPolygonsListeners = function _initPolygonsListeners() {
            this._polygonsObjectManager.objects.events.add(['optionschange', 'objectoptionschange'], this._onPolygonOptionsChangeHandler, this);
        };

        PolylabelObjectManager.prototype._onPolygonOptionsChangeHandler = function _onPolygonOptionsChangeHandler(event) {
            var _this10 = this;

            var polygon = this._polygonsObjectManager.objects.getById(event.get('objectId'));
            if (!polygon) return;

            this._calculatePolygonLabelData(polygon, true).then(function (label) {
                label.setVisibilityForce('none');
                _this10._setInLabelState(polygon, 'label', label);

                label.setLayoutTemplate();
                label.setNewOptions(polygon.options);

                _this10._analyzeAndSetLabelData(polygon, ['dot', 'label'], _this10._getFromLabelState(polygon, 'label'));
            });
        };

        PolylabelObjectManager.prototype._initLabelsOMListeners = function _initLabelsOMListeners() {
            var _this11 = this;

            var controller = {
                onBeforeEventFiring: function onBeforeEventFiring(events, type, event) {
                    var labelId = event.get('objectId');
                    if (!labelId) return false;

                    var polygonId = labelId.split('#')[1];
                    polygonId = isNaN(Number(polygonId)) ? polygonId : Number(polygonId);

                    var polygon = _this11._polygonsObjectManager.objects.getById(polygonId);
                    var label = _this11._labelsObjectManager.objects.getById(labelId);
                    if (label && label.options.pane === 'phantom' || !polygon) return false;

                    _this11._polygonsObjectManager.events.fire('label' + type, {
                        objectId: polygonId,
                        type: 'label' + type
                    });

                    return false;
                }
            };
            var eventManager = new EventManager({
                controllers: [controller]
            });
            this._labelsObjectManager.events.setParent(eventManager);
        };

        PolylabelObjectManager.prototype._deleteLabelStateListeners = function _deleteLabelStateListeners() {
            var _this12 = this;

            this._polygonsObjectManager.objects.each(function (polygon) {
                if (polygon.geometry.type === 'Polygon') {
                    _this12._deleteLabelStateListener(polygon);
                }
            });
        };

        PolylabelObjectManager.prototype._deleteLabelStateListener = function _deleteLabelStateListener(polygon) {
            var monitor = this._getFromLabelState(polygon, 'labelMonitor');
            if (monitor) monitor.removeAll();
        };

        PolylabelObjectManager.prototype._deleteLabelsOverlaysListeners = function _deleteLabelsOverlaysListeners() {
            this._labelsObjectManager.objects.overlays.events.remove(['add', 'remove'], this._labelsOverlaysEventHandler, this);
        };

        PolylabelObjectManager.prototype._deletePolygonsListeners = function _deletePolygonsListeners() {
            this._polygonsObjectManager.objects.events.remove(['optionschange', 'objectoptionschange'], this._onPolygonOptionsChangeHandler, this);
        };

        PolylabelObjectManager.prototype._deletePolygonsObjectsListeners = function _deletePolygonsObjectsListeners() {
            this._polygonsObjectManager.objects.events.remove(['add', 'remove'], this._polygonCollectionEventHandler, this);
            this.destroyMapListeners();
        };

        PolylabelObjectManager.prototype._deleteLabelsOMListeners = function _deleteLabelsOMListeners() {
            var _this13 = this;

            this._polygonsObjectManager.objects.each(function (polygon) {
                var label = _this13._getFromLabelState(polygon, 'label');
                if (polygon.geometry.type === 'Polygon' && label) {
                    label.destroy();
                }
            });
            this._clearLabels();
        };

        PolylabelObjectManager.prototype._clearLabels = function _clearLabels() {
            this._labelsObjectManager.removeAll();
        };

        return PolylabelObjectManager;
    }(PBase);

    _provide(PolylabelObjectManager);
});
//# sourceMappingURL=PolylabelObjectManager.js.map

ymaps.modules.define('util.createPolylabel', ['src.polylabel.PolylabelCollection', 'src.polylabel.PolylabelObjectManager', 'ObjectManager'], function (_provide, PCollection, PObjectManager, ObjectManager) {
  _provide(function (map, data) {
    return data instanceof ObjectManager ? new PObjectManager(map, data) : new PCollection(map, data);
  });
});
//# sourceMappingURL=util.createPolylabel.js.map

ymaps.modules.define('src.util.checkPointPosition', [], function (_provide) {
    _provide(isInside);

    /**
         * Проверка, находится ли точка внутри полигона.
         * @param {Array[2]} point - Точка.
         * @param {Array} coords - Координаты полигона.
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
     * Определяет позицию точки относительно ребра.
     * @param {Array[2]} p - Исследуемая точка.
     * @param {Array[2]} p0 - Первая точка ребра.
     * @param {Array[2]} p1 - Вторая точка ребра.
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
     * Определяет, положения луча, выпущенного из точки, относительно ребра (Crosses, Affects, Neutral).
     * @param {Arrya[2]} point - Исследуемая точка.
     * @param {Array} edge - Ребро.
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

ymaps.modules.define('src.util.getPolesOfInaccessibility', ['util.calculateArea', 'GeoObject'], function (_provide, calculateArea, GeoObject) {
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
                var polygon = new GeoObject({
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

ymaps.modules.define('src.util.zoom.getFirstZoomInside', ['src.util.checkPointPosition', 'src.config'], function (_provide, isInside, CONFIG) {
    _provide(function (map, center, coords, size, offset, resolvedInaccuracy) {
        var i = CONFIG.MIN_ZOOM,
            j = CONFIG.MAX_ZOOM;

        var zoom = void 0;
        while (i < j) {
            zoom = Math.floor((i + j) / 2);
            var ri = isNaN(Number(resolvedInaccuracy)) ? 0 : Number(resolvedInaccuracy);
            var elemPoints = getElemPoints(map, center, zoom, size, offset || [0, 0], ri);
            if (checkIsInside(map, coords, elemPoints.normal, zoom) || ri !== 0 && checkIsInside(map, coords, elemPoints.withInaccuracy, zoom)) {
                j = zoom;
            } else {
                i = zoom + 1;
            }
        }
        return i;
    });

    function getElemPoints(map, center, zoom, size, offset, ri) {
        var centerProj = map.options.get('projection').toGlobalPixels(center, zoom);
        var w = size.width,
            h = size.height;


        centerProj[0] += offset[0];
        centerProj[1] += offset[1];

        var elemPoints = [];
        var elemPointsWithInaccuracy = [];
        elemPoints.push([centerProj[0] - w / 2, centerProj[1] - h / 2], [centerProj[0] - w / 2, centerProj[1] + h / 2], [centerProj[0] + w / 2, centerProj[1] - h / 2], [centerProj[0] + w / 2, centerProj[1] + h / 2]);
        elemPointsWithInaccuracy.push([elemPoints[0][0] + ri > centerProj[0] ? centerProj[0] : elemPoints[0][0] + ri, elemPoints[0][1] + ri > centerProj[1] ? centerProj[1] : elemPoints[0][1] + ri], [elemPoints[1][0] + ri > centerProj[0] ? centerProj[0] : elemPoints[1][0] + ri, elemPoints[1][1] - ri < centerProj[1] ? centerProj[1] : elemPoints[1][1] - ri], [elemPoints[2][0] - ri < centerProj[0] ? centerProj[0] : elemPoints[2][0] - ri, elemPoints[2][1] + ri > centerProj[1] ? centerProj[1] : elemPoints[2][1] + ri], [elemPoints[3][0] - ri < centerProj[0] ? centerProj[0] : elemPoints[3][0] - ri, elemPoints[3][1] - ri < centerProj[1] ? centerProj[1] : elemPoints[3][1] - ri]);
        return {
            normal: elemPoints,
            withInaccuracy: elemPointsWithInaccuracy
        };
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

ymaps.modules.define('src.util.zoom.parseZoomData', ['util.array', 'util.objectKeys', 'src.config'], function (_provide, _utilArray, _utilObjectKeys, CONFIG) {
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
        var valid = ['number', 'string', 'boolean', 'object'];
        if (zoomData && !_utilArray.isArray(zoomData) && (typeof zoomData === 'undefined' ? 'undefined' : _typeof(zoomData)) === 'object') {
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
        var result = {};
        for (var i = MIN_ZOOM; i <= MAX_ZOOM; i++) {
            result[i] = val;
        }
        return result;
    }
});
//# sourceMappingURL=parseZoomData.js.map

ymaps.modules.define('src.util.zoom.setOneZoomVisibility', ['src.util.zoom.getFirstZoomInside', 'src.label.util.getLayoutSize'], function (_provide, getFirstZoomInside, getLayoutSize) {

    var functions = {
        label: analyseLabel,
        dot: analyseDot
    };

    _provide(function (map, zoom, labelInst, labelType) {
        var labelData = labelInst.getLabelData();
        var coordinates = labelData.getPolygonCoords();

        return functions[labelType](map, zoom, labelInst, labelData, coordinates, labelInst.getLayout(labelType));
    });

    function getVisible(currentType, newType, newIsVisible) {
        var types = ['none', 'dot', 'label'];
        var result = currentType;
        if (newIsVisible) {
            result = types.indexOf(newType) > types.indexOf(currentType) ? newType : currentType;
        }
        return result;
    }

    function analyseDot(map, zoom, labelInst, labelDataInst, coordinates, layout) {
        var size = getLayoutSize(layout);
        if (!size) return false;

        var labelData = labelDataInst.getAll();
        var zoomInfo = labelDataInst.getZoomInfo(zoom);

        labelDataInst.setData('dotSize', size);

        var firstZoomInside = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter, coordinates, size, zoomInfo.labelOffset, zoomInfo.permissibleInaccuracyOfVisibility);
        labelDataInst.setZoomInfo(zoom, 'visible', getVisible(zoomInfo.visible, 'dot', zoom >= firstZoomInside));
        return true;
    }

    function analyseLabel(map, zoom, labelInst, labelDataInst, coordinates, layout) {
        var size = getLayoutSize(layout);
        if (!size) return false;

        var labelData = labelDataInst.getAll();
        var zoomInfo = labelData.zoomInfo[zoom];
        labelDataInst.setZoomInfo(zoom, 'labelSize', size);
        var firstZoom = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter, coordinates, size, zoomInfo.labelOffset, zoomInfo.permissibleInaccuracyOfVisibility);
        labelDataInst.setZoomInfo(zoom, 'visible', getVisible(zoomInfo.visible, 'label', zoom >= firstZoom));
        return true;
    }
});
//# sourceMappingURL=setOneZoomVisibility.js.map

ymaps.modules.define('src.util.zoom.setZoomVisibility', ['src.util.zoom.getFirstZoomInside', 'src.label.util.getLayoutSize'], function (_provide, getFirstZoomInside, getLayoutSize) {
    _provide(function (labelType, map, zoom, currVisible, layout, center, polygonCoordinates, labelOffset, permissibleInaccuracyOfVisibility) {
        return analyze(labelType, map, zoom, currVisible, layout, center, polygonCoordinates, labelOffset, permissibleInaccuracyOfVisibility);
    });

    function getVisible(currentType, newType, newIsVisible) {
        var types = ['none', 'dot', 'label'];
        var result = currentType;
        if (newIsVisible) {
            result = types.indexOf(newType) > types.indexOf(currentType) ? newType : currentType;
        }
        return result;
    }

    function analyze(type, map, zoom, currVisible, layout, center, polygonCoordinates, labelOffset, permissibleInaccuracyOfVisibility) {
        var size = getLayoutSize(layout);
        if (!size) return;

        var firstZoomInside = getFirstZoomInside(map, center, polygonCoordinates, size, labelOffset, permissibleInaccuracyOfVisibility);

        return {
            visible: getVisible(currVisible, type, zoom >= firstZoomInside),
            size: size
        };
    }
});
//# sourceMappingURL=setZoomVisibility.js.map
