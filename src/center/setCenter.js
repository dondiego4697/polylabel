import getPolylabelCenter from 'getPolesOfInaccessibility';
import parseZoomData from 'parseZoomData';

export default setCenter;

function setCenter(target, geoObject, properties) {
    const {labelCenterCoords} = properties;
    const autoCenterData = getPolylabelCenter(geoObject.geometry.getCoordinates(), 1.0);
    target.autoCenter = autoCenterData.center;
    target.polygonIndex = autoCenterData.index;

    if (Object.prototype.toString.call(labelCenterCoords) !== '[object Object]') {
        return;
    }
    Object.keys(labelCenterCoords).forEach(key => {
        const zoomArr = parseZoomData(key, true);
        zoomArr.forEach(z => {
            target.data[z].center = labelCenterCoords[key];
        });
    });
}