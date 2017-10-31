import templateLayoutFactory from 'templateLayoutFactory';
const defaultDotTemplate = `<div {% style %}background-color: red;
    width: 10px; height: 10px; border-radius: 50px;{% endstyle %}></div>`;

export default function (template) {
    if (typeof template === 'undefined') {
        template = defaultDotTemplate;
    }
    return templateLayoutFactory.createClass(`
    <div {% style %}position: {{options.labelPosition}};
        top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>
        ${template}
    </div>`);
}
