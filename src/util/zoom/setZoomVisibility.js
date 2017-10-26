import getFirstZoomInside from 'src.util.zoom.getFirstZoomInside';
import getLayoutSize from 'src.label.util.getLayoutSize';

export default function (map, labelInst) {
    const labelData = labelInst.getLabelData();
    let coordinates = labelData.getPolygonCoords();

    let dotSize = getLayoutSize(labelInst.getLayout('dot'));
    if (dotSize) {
        labelData.setData('dotSize', dotSize);

        analyseDot(
            map, labelInst, labelData, coordinates, labelInst.getLayout('dot'), dotSize
        );
    }

    let labelCache = {};
    Object.keys(labelData.getZoomInfo()).forEach(z => {
        analyseLabel(
            map, labelInst, labelData, z, coordinates, labelInst.getLayout('label'), labelCache
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

function analyseDot(map, labelInst, labelDataInst, coordinates, layout, size) {
    let labelData = labelDataInst.getAll();
    Object.keys(labelData.zoomInfo).forEach((z) => {
        let zoomInfo = labelDataInst.getZoomInfo(z);
        let zoom = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter, coordinates, size, zoomInfo.labelOffset, zoomInfo.permissibleInaccuracyOfVisibility);
        labelDataInst.setZoomInfo(z, 'visible', getVisible(zoomInfo.visible, 'dot', z >= zoom));
    });
}

function analyseLabel(map, labelInst, labelDataInst, zoom, coordinates, layout, labelCache) {
    let labelData = labelDataInst.getAll();
    let zoomInfo = labelData.zoomInfo[zoom];
    const cacheKey = `label_${zoomInfo.center || labelData.autoCenter}_${zoomInfo.style.className}_${zoomInfo.style.textSize}`;
    //TODO разобраться с кешом
    /*  if (labelCache[cacheKey]) {
         labelDataInst.setZoomInfo(zoom, 'labelSize', labelCache[cacheKey].size);
         labelDataInst.setZoomInfo(zoom, 'visible', getVisible(zoomInfo.visible, 'label', zoom >= labelCache[cacheKey].firstZoom));
         return;
     } */
    let size = getLayoutSize(layout);
    if (size) {
        labelInst.setStyles(zoomInfo.style);
        labelDataInst.setZoomInfo(zoom, 'labelSize', size);
        const firstZoom = getFirstZoomInside(map, zoomInfo.center || labelData.autoCenter,
            coordinates, size, zoomInfo.labelOffset, zoomInfo.permissibleInaccuracyOfVisibility);
        labelDataInst.setZoomInfo(zoom, 'visible', getVisible(zoomInfo.visible, 'label', zoom >= firstZoom));
    }
    //labelCache[cacheKey] = { firstZoom, size };
}
