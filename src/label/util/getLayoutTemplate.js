import createLabelLayoutTemplate from 'src.label.util.createLabelLayoutTemplate';
import createDotLayoutTemplate from 'src.label.util.createDotLayoutTemplate';

export default function (options, layoutTemplateCache) {
    let createTemplate = {
        labelLayout: createLabelLayoutTemplate,
        labelDotLayout: createDotLayoutTemplate
    };
    return ['labelLayout', 'labelDotLayout'].reduce((result, key) => {
        let layoutTemplate = options[key];
        let layoutTemplateKey = !layoutTemplate ? `default${key}` : layoutTemplate;

        if (layoutTemplateCache[layoutTemplateKey]) {
            result[key] = layoutTemplateCache[layoutTemplateKey];
        } else {
            const template = createTemplate[key](layoutTemplate);
            result[key] = template;
            layoutTemplateCache[layoutTemplateKey] = template;
        }
        return result;
    }, {});
}