import PCollection from 'PCollection';
import PObjectManager from 'PObjectManager';
import ObjectManager from 'ObjectManager';

class Polylabel {
    constructor(map, data) {
        this._instance = data instanceof ObjectManager ?
            new PObjectManager(map, data) :
            new PCollection(map, data);
    }

    getLabelState(polygon) {
        return this._instance.getLabelState(polygon);
    }

    getConfiguredVisibility(polygon) {
        return this._instance.getConfiguredVisibility(polygon);
    }

    getCurrentVisibility(polygon) {
        return this._instance.getCurrentVisibility(polygon);
    }

    destroy() {
        this._instance.destroy();
    }
}

export default Polylabel;
