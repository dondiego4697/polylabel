import templateLayoutFactory from 'templateLayoutFactory';

const template = templateLayoutFactory.createClass(`
    <div {% style %}position: {{options.labelPosition}};
        top: {{options.labelTop}}px; left: {{options.labelLeft}}px; {% endstyle %}>
        <div class="{{options.labelClassName}}"
            {% style %}text-align: center; font-size: {{options.labelTextSize}}px;
            color: {{options.labelTextColor}}; {% endstyle %}>
                {% include options.labelTemplateLayout %}
            </div>
        </div>`
        );

export default template;
