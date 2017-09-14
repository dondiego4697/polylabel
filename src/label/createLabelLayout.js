import templateLayoutFactory from 'templateLayoutFactory';
/**
 * Label layout tamplate
*/
const template = templateLayoutFactory.createClass(
    '<div {% style %}position: {{properties.position}}; top: {{properties.top}}px;' +
    'left: {{properties.left}}px; {% endstyle %}>$[properties.html]</div>'
);
export default template;
