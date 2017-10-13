import getFirstZoomInside from 'src.util.zoom.getFirstZoomInside';
import getLayoutSize from 'src.label.util.getLayoutSize';

export default function (map, labelData, coordinates, labelInst) {
    let dotSize = getLayoutSize(labelInst.getLayout().dot);
    labelData.dotSize = dotSize;

    analyseDot(
        map, labelInst, labelData, coordinates, labelInst.getLayout().dot, dotSize
    );
    Object.keys(labelData.zoomInfo).forEach(z => {
        analyseLabel(
            map, labelInst, labelData, z, coordinates, labelInst.getLayout().label
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
    Object.keys(labelData.zoomInfo).forEach((z) => {
        let zoomInfo = labelData.zoomInfo[z];
        let zoom;
        if (!zoomInfo.center) {
            zoom = getFirstZoomInside(map, labelData.autoCenter, coordinates, size, zoomInfo.labelOffset, zoomInfo.permissibleInaccuracyOfVisibility);
        } else {
            zoom = getFirstZoomInside(map, zoomInfo.center, coordinates, size, zoomInfo.labelOffset, zoomInfo.permissibleInaccuracyOfVisibility);
        }
        zoomInfo.visible = getVisible(zoomInfo.visible, 'dot', z >= zoom);
    });
}

function analyseLabel(map, labelInst, labelData, zoom, coordinates, layout) {
    let zoomInfo = labelData.zoomInfo[zoom];
    labelInst.setStyles(zoomInfo.style);
    let size = getLayoutSize(layout);
    zoomInfo.labelSize = size;
    const firstZoom = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter,
        coordinates, size, zoomInfo.labelOffset, zoomInfo.permissibleInaccuracyOfVisibility);
    zoomInfo.visible = getVisible(zoomInfo.visible, 'label', zoom >= firstZoom);
}
