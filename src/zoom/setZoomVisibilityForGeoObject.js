import getFirstZoomInside from 'getFirstZoomInside';
import getLayoutSize from 'getLayoutSize';
import getLabelLayout from 'getLabelLayout';

export default function (map, labelData, coordinates, labelInst) {
    let promises = [];
    let zoomBuff = {};

    Object.keys(labelData.zoomInfo).forEach(z => {
        promises.push(analyseAndSetLabelStyle(
            map, labelInst, labelData, z, coordinates, labelInst.getLayout(), zoomBuff
        ));
    });
    return Promise.all(promises);
}

function analyseAndSetLabelStyle(map, labelInst, labelData, zoom, coordinates, layout, zoomBuff) {
    return new Promise(resolve => {
        let zoomInfo = labelData.zoomInfo[zoom];
        let key = `${zoomInfo.style.className}_${zoomInfo.style.textSize}`;
        if (zoomBuff[key]) {
            zoomInfo.visible = zoom >= zoomBuff[key];
            resolve();
            return;
        }
        labelInst._setStyles(zoomInfo.style);
        let size = getLayoutSize(layout);
        labelInst._setSize(size);
        zoomInfo.style.size = {
            width: size.width,
            height: size.height
        }
        const firstZoom = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter,
            coordinates[labelData.polygonIndex], size);
        zoomInfo.visible = zoom >= firstZoom;
        zoomBuff[key] = firstZoom;
        resolve();
    });
}
