import getPolylabelCenter from 'getPolesOfInaccessibility';
import parseZoomData from 'parseZoomData';

/**
 * Set centers for each zoom;
 * @param {Object} target - Target object containing each zoom in properties.
 * @param {GeoObject} geoObject
 * @param {Object} properties
 * @param {Array | Object} properties.labelCenterCoords - Center data.
 * May be one point(Array) or for certains zooms(Object).
*/
export default function setCenter(target, geoObject, properties) {
    const {labelCenterCoords} = properties;
    const autoCenterData = getPolylabelCenter(geoObject.geometry.getCoordinates(), 1.0);
    target.autoCenter = autoCenterData.center;
    target.polygonIndex = autoCenterData.index;

    if (Array.isArray(labelCenterCoords)) {
        Object.keys(target.zoomInfo).forEach(z => {
            target.zoomInfo[z].center = labelCenterCoords;
        });
    } else if (Object.prototype.toString.call(labelCenterCoords) === '[object Object]') {
        const data = parseZoomData(labelCenterCoords);
        Object.keys(data).forEach(z => {
            if (typeof data[z] !== 'undefined') {
                target.zoomInfo[z].center = data[z];
            }
        });
    }
}
