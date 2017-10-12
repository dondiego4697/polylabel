import getFirstZoomInside from 'src.util.zoom.getFirstZoomInside';
import getLayoutSize from 'src.label.util.getLayoutSize';

export default function (map, labelData, coordinates, labelInst) {
    let zoomBuff = {};

    let dotSize = getLayoutSize(labelInst.getLayout().dot);
    labelData.dotSize = dotSize;
    analyseDot(
        map, labelInst, labelData, coordinates, labelInst.getLayout().dot, dotSize
    );
    Object.keys(labelData.zoomInfo).forEach(z => {
        analyseLabel(
            map, labelInst, labelData, z, coordinates, labelInst.getLayout().label, zoomBuff
        );
    });
    return Promise.resolve();
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
    labelInst.setSize('dot', size);
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
}

function analyseLabel(map, labelInst, labelData, zoom, coordinates, layout, zoomBuff) {
    let zoomInfo = labelData.zoomInfo[zoom];
    let key = `label_${zoomInfo.style.className}_${zoomInfo.style.textSize}`;
    if (zoomBuff[key]) {
        zoomInfo.visible = getVisible(zoomInfo.visible, 'label', zoom >= zoomBuff[key].firstZoom);
        zoomInfo.labelSize = zoomBuff[key].size;
        return;
    }
    labelInst.setStyles(zoomInfo.style);
    let size = getLayoutSize(layout);
    labelInst.setSize('label', size);
    zoomInfo.labelSize = size;
    const firstZoom = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter,
        coordinates, size);
    zoomInfo.visible = getVisible(zoomInfo.visible, 'label', zoom >= firstZoom);
    zoomBuff[key] = {
        firstZoom,
        size
    };
}
