let createGeoObject = function () {
    return new ymaps.GeoObject({
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [55.75, 37.80],
                    [55.80, 37.90],
                    [55.75, 38.00],
                    [55.70, 38.00],
                    [55.70, 37.80]
                ]
            ],
            fillRule: "nonZero"
        },
        properties: {}
    }, {
        fillColor: '#ffff0022',
        strokeColor: '#3caa3c88',
        strokeWidth: 7
    });
}
let createMap = function () {
    return new ymaps.Map("map", {
        center: [55.9238145091058, 37.897131347654376],
        zoom: 2,
        controls: ['searchControl', 'zoomControl']
    }, {
        searchControlProvider: 'yandex#search'
    });;
}
let createOM = function (params) {
    return new ymaps.ObjectManager(params);
}
