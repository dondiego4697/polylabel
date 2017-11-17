import templateLayoutFactory from 'templateLayoutFactory';

/**
 * Создает пользовательские шаблоны
 */
export default function (labelLayout, labelDotLayout, polygonColor) {
    const dotDefault = `<div {% style %}background-color: ${polygonColor}; {% endstyle %}
        class="ymaps-polylabel-dot-default"></div>`;
    return {
        label: {
            iconLabelTemplateLayout: templateLayoutFactory.createClass(labelLayout)
        },
        dot: {
            iconLabelDotTemplateLayout: templateLayoutFactory.createClass(labelDotLayout || dotDefault)
        }
    };
}
