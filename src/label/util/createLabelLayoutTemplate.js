import templateLayoutFactory from 'templateLayoutFactory';

export default function (template) {
    return templateLayoutFactory.createClass(`
    <div {% style %}position: {{options.labelPosition}}; top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>
        <div class="{{options.labelClassName}}"
            {% style %}font-size: {{options.labelTextSize}}px; color: {{options.labelTextColor}}; {% endstyle %}>
            ${template}
        </div>
    </div>`);
}
