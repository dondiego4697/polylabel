export default createLabel;
function createLabel(options) {
    const {labelHtml, labelText, labelTextClassName} = options;
    let result;
    if (labelHtml !== 'default') {
        result = labelHtml;
    } else {
        let label = document.createElement('div');
        label.innerHTML = labelText !== 'default' ? labelText : null;
        if (labelTextClassName !== 'default') {
            label.className = labelTextClassName;
        }
        result = label;
    }
    var LayoutClass = ymaps.templateLayoutFactory.createClass(
        '<div {% style %}position: {{properties.position}}; top: {{properties.top}}px;' +
        'left: {{properties.left}}px; {% endstyle %}>$[properties.html]</div>'
    );
    return new ymaps.Placemark([0, 0],
        {
            html: result.outerHTML,
            top: 0,
            left: 0,
            position: 'absolute'
        },
        {
            iconLayout: LayoutClass
        });
}
