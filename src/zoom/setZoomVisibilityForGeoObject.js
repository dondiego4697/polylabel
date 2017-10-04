import getFirstZoomInside from 'getFirstZoomInside';
import getLayoutSize from 'getLayoutSize';
import getLabelLayout from 'getLabelLayout';
import setZoomVisibility from 'setZoomVisibility';

export default function (map, labelData, coordinates, labelInst) {
    let promises = [];
    let zoomBuff = {};

    let dotSize = getLayoutSize(labelInst.getLayout().dot);
    labelData.dotSize = {
        width: dotSize.width,
        height: dotSize.height
    };
    promises.push(analyseDot(
        map, labelInst, labelData, coordinates, labelInst.getLayout().dot, dotSize
    ));
    Object.keys(labelData.zoomInfo).forEach(z => {
        promises.push(analyseLabel(
            map, labelInst, labelData, z, coordinates, labelInst.getLayout().label, zoomBuff
        ));
    });
    return Promise.all(promises);
}

function getVisible(currentType, newType, newIsVisible) {
    let types = ['none', 'dot', 'label'];
    let result = currentType;
    if (newIsVisible) {
        result = types.indexOf(newType) > types.indexOf(currentType) ? newType : currentType;
    }
    return result;
}

function analyseDot(map, labelInst, labelData, coordinates, layout, size) {
    return new Promise(resolve => {
        labelInst._setSize('dot', size);
        const autoZoom = getFirstZoomInside(map, labelData.autoCenter, coordinates, size);
        let zoom = autoZoom;
        Object.keys(labelData.zoomInfo).forEach((z) => {
            let zoomInfo = labelData.zoomInfo[z];
            if (!zoomInfo.center) {
                zoom = autoZoom;
            } else {
                zoom = getFirstZoomInside(map, zoomInfo.center, coordinates, size);
            }
            zoomInfo.visible = getVisible(zoomInfo.visible, 'dot', z >= zoom);
        });
        resolve();
    });
}

function analyseLabel(map, labelInst, labelData, zoom, coordinates, layout, zoomBuff) {
    return new Promise(resolve => {
        let zoomInfo = labelData.zoomInfo[zoom];
        let key = `label_${zoomInfo.style.className}_${zoomInfo.style.textSize}`;
        if (zoomBuff[key]) {
            zoomInfo.visible = getVisible(zoomInfo.visible, 'label', zoom >= zoomBuff[key].firstZoom);
            zoomInfo.labelSize = getSize(zoomBuff[key].size);
            resolve();
            return;
        }
        labelInst._setStyles(zoomInfo.style);
        let size = getLayoutSize(layout);
        labelInst._setSize('label', size);
        zoomInfo.labelSize = getSize(size);
        const firstZoom = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter,
            coordinates, size);
        zoomInfo.visible = getVisible(zoomInfo.visible, 'label', zoom >= firstZoom);
        zoomBuff[key] = {
            firstZoom,
            size
        };
        resolve();
    });
}

function getSize(size) {
    return {
        width: size.width,
        height: size.height
    }
}
