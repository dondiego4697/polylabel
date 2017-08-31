/* jshint esversion: 6 */

module.exports = function (
    /* eslint-disable */
    { template, types: t }
    /* eslint-enable */) {
    function onCallExpression(path, file) {
        const calleePath = path.get('callee');

        const pattern = Object.keys(file.opts.replace || {}).find(x => calleePath.matchesPattern(x));
        if (!pattern) {
            return;
        }

        const replacement = file.opts.replace[pattern];
        const simple = typeof replacement === 'string';
        const module = simple ? replacement : replacement[0];

        try {
            const helper = this.file.importYmModule(module);
            path.node.callee = simple
                ? helper
                : t.memberExpression(helper, t.identifier(replacement[1]));
        } catch (e) {
            console.error(`Error while replacing ${pattern} with ${replacement.join('.')}:`, e);
        }
    }

    function onProgramEnter(path, state) {
        const helpersOverrides = state.opts.helpersOverrides || {};

        // HACK: monkey-patch addHelper to add our specific helpers, instead of babel ones.
        const addHelper = state.file.addHelper;
        state.file.addHelper = function (name) {
            if (helpersOverrides[name]) {
                return state.file.importYmModule(helpersOverrides[name]);
            }

            return addHelper.call(this, name);
        };
    }

    return {
        visitor: {
            Program: { enter: onProgramEnter },
            CallExpression: onCallExpression
        }
    };
};
