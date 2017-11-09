import PCollection from 'src.polylabel.PolylabelCollection';
import PObjectManager from 'src.polylabel.PolylabelObjectManager';
import ObjectManager from 'ObjectManager';

export default function (map, data) {
    return data instanceof ObjectManager ?
        new PObjectManager(map, data) :
        new PCollection(map, data);
}
