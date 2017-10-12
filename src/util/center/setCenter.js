import getPolylabelCenter from 'src.util.getPolesOfInaccessibility';
import parseZoomData from 'src.util.zoom.parseZoomData';

/**
 * Set centers for each zoom;
 * @param {Object} target - Target object containing each zoom in properties.
 * @param {Array} coordinates
 * @param {Object} properties
 * @param {Array | Object} labelCenterCoords - Center data.
 * May be one point(Array) or for certains zooms(Object).
 */
export default function setCenter(target, coordinates, labelCenterCoords) {
    const autoCenterData = getPolylabelCenter(coordinates, 1.0);
    target.autoCenter = autoCenterData.center;
    target.polygonIndex = autoCenterData.index;

    if (Array.isArray(labelCenterCoords)) {
        Object.keys(target.zoomInfo).forEach(z => {
            target.zoomInfo[z].center = labelCenterCoords;
        });
    } else if (labelCenterCoords && typeof labelCenterCoords === 'object') {
        const data = parseZoomData(labelCenterCoords);
        Object.keys(data).forEach(z => {
            if (typeof data[z] !== 'undefined') {
                target.zoomInfo[z].center = data[z];
            }
        });
    }
}
