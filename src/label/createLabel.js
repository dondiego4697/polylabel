export default createLabel;
function createLabel(options) {
    const {labelHtml, labelText, labelTextClassName} = options;
    let result;
    if (labelHtml) {
        result = labelHtml;
    } else {
        let label = document.createElement('div');
        label.innerHTML = labelText;
        if (labelTextClassName) {
            label.className = labelTextClassName;
        }
        result = label;
    }
    var LayoutClass = ymaps.templateLayoutFactory.createClass(
        '<div style="position: absolute; top: {{properties.top}}px; ' +
        'left: {{properties.left}}px">$[properties.html]</div>'
    );
    return new ymaps.Placemark([0, 0],
        {
            html: result.outerHTML,
            top: 0,
            left: 0
        },
        {
            iconLayout: LayoutClass
        });
}
