import templateLayoutFactory from 'templateLayoutFactory';

const dotDefault = `<div {% style %}background-color: red;
width: 10px; height: 10px; border-radius: 50px;{% endstyle %}></div>`;

/**
 * Создает пользовательские шаблоны
 */
export default function (labelLayout, labelDotLayout) {
    return {
        label: {
            iconLabelTemplateLayout: templateLayoutFactory.createClass(labelLayout)
        },
        dot: {
            iconLabelDotTemplateLayout: templateLayoutFactory.createClass(labelDotLayout || dotDefault)                
        }
    }
}