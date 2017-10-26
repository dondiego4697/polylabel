import PCollection from 'src.polylabel.PolylabelCollection';
import PObjectManager from 'src.polylabel.PolylabelObjectManager';
import ObjectManager from 'ObjectManager';

/**
 * @param {Map} map
 * @param {Object | ObjectManager} data - Object with collections or ObjectManager
 * @param {GeoObjectCollection} data.labelsCollection
 * @param {GeoObjectCollection} data.polygonsCollection
 */
export default function (map, data) {
    return data instanceof ObjectManager ?
        new PObjectManager(map, data) :
        new PCollection(map, data);;
}