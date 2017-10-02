import Polylabel from 'Polylabel';

/**
 * @param {Map} map
 * @param {Object | ObjectManager} data - Object with collections or ObjectManager
 * @param {GeoObjectCollection} data.labelsCollection
 * @param {GeoObjectCollection} data.polygonsCollection
 */
export default function (map, data) {
    return new Polylabel(map, data);
}
