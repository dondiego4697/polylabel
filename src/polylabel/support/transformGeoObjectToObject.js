export default function (geoObject, id) {
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
}
