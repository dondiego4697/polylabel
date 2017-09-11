export default function (template, argsArr) {
    let result = template;
    argsArr.forEach((item, i) => {
        result = result.replace(new RegExp(`\\\$${i + 1}`, 'g'), item);
    });
    return result;
}
