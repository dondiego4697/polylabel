const objectValues = Object.values || (obj => Object.keys(obj).reduce((mem, key) => (mem.push(obj[key]), mem), []));
const capitalize = str => str[0].toUpperCase() + str.slice(1);

module.exports = function ({ template, types: t }) {
    const buildYmDefine = template('ymaps.modules.define(MODULE_NAME, [SOURCES], function(PARAMS) { BODY });');

    const ymBuiltins = {
        logger: template('ym.logger'),
        require: template('ym.modules.require')
    };

    function getModuleName(state) {
        const sourceExtension = state.opts.sourceExtension || '.esn.js';

        let moduleName = state.file.opts.filenameRelative;
        if (moduleName.endsWith(sourceExtension)) {
            moduleName = moduleName.substr(0, moduleName.length - sourceExtension.length);
        }
        const splitModuleName = moduleName.split('/');
        moduleName = splitModuleName[splitModuleName.length - 1];
        const jsIndex = moduleName.indexOf('.js');
        moduleName = moduleName.slice(0, jsIndex !== -1 ? jsIndex : moduleName.length);
        return moduleName;
    }

    /**
     * Squashes multiple identical imports into single import and multiple
     * variables for aliasing imports.
     */
    function squashImports(imports) {
        const hash = { /* module: local */ };

        const declarations = [];
        const simplified = [];

        for (let i = 0; i < imports.length; i++) {
            const module = imports[i].module;
            const local = imports[i].local;

            if (hash[module]) {
                declarations.push(t.variableDeclaration("var", [
                    t.variableDeclarator(local, hash[module])
                ]));
            } else {
                hash[module] = local;
                simplified.push({ module, local });
            }
        }

        return { declarations, imports: simplified };
    }

    function onProgramEnter(path, state) {
        state.file.ymImports = {};

        // Add import for other plugins to use.
        state.file.importYmModule = function (name) {
            if (!state.file.ymImports[name]) {
                const local = name.replace(/\.([A-Z])/, (m, letter) => letter.toUpperCase());
                state.file.ymImports[name] = this.scope.generateUidIdentifier(local);
            }

            return state.file.ymImports[name];
        };
    }

    function onProgramExit(path, state) {
        if (this.ran) {
            return;
        }

        this.ran = true;

        const ymModuleName = state.opts.ymModuleName || 'ym';

        // Track explicit imports and exports.
        const imports = [];
        let hasExport = false;

        // Track explicit/implicit importing, i.e. if es2015 export default or explicit provide is used.
        const implicitProvideIdentifier = path.scope.generateUidIdentifier('provide');
        let explicitProvideIdentifier = null;

        // Transform top-level import and export statements.
        for (let statementPath of path.get('body')) {
            // Remove imports and construct ym dependencies and declaration instead.
            if (statementPath.isImportDeclaration()) {
                const moduleName = statementPath.node.source.value;
                const specifiers = statementPath.node.specifiers;

                if (moduleName === ymModuleName) {
                    // Deal with special 'ym' module.
                    const ymImports = [];
                    for (let specifier of specifiers) {
                        const builtin = ymBuiltins[specifier.imported.name];
                        if (builtin) {
                            ymImports.push(t.variableDeclaration('var', [t.variableDeclarator(specifier.local, builtin().expression)]));
                        } else if (specifier.imported.name === 'provide') {
                            explicitProvideIdentifier = specifier.local;
                        } else {
                            throw new statementPath.buildCodeFrameError(`Only provide() and ${Object.keys(ymBuiltins)} can to be imported from ${ymModuleName}`);
                        }
                    }

                    statementPath.replaceWithMultiple(ymImports);
                } else {
                    // Deal with normal modules.
                    if (specifiers.length) {
                        if (specifiers.length !== 1 || !t.isImportDefaultSpecifier(specifiers[0])) {
                            throw statementPath.buildCodeFrameError('Only single default imports are allowed.');
                        }

                        imports.push({ module: moduleName, local: specifiers[0].local });
                    } else {
                        imports.push({ module: moduleName, local: null });
                    }

                    statementPath.remove();
                }
            }

            // Replace export with provide call.
            if (statementPath.isExportDeclaration()) {
                if (explicitProvideIdentifier) {
                    throw statementPath.buildCodeFrameError('Exports are not allowed in module with explicit provide import.');
                }

                if (hasExport) {
                    throw statementPath.buildCodeFrameError('Only single export per module is allowed.');
                }

                hasExport = true;

                if (statementPath.isExportDefaultDeclaration()) {
                    const declarationPath = statementPath.get('declaration');
                    const declaration = declarationPath.node;
                    if (declarationPath.isFunctionDeclaration()) {
                        if (declaration.id) {
                            // Named function declaration and export.
                            statementPath.replaceWithMultiple([
                                statementPath.node.declaration,
                                t.callExpression(implicitProvideIdentifier, [declaration.id])
                            ]);
                        } else {
                            // Anonymous function export.
                            const anonymousFunction = t.functionExpression(null,
                                declaration.params, declaration.body, declaration.generator, declaration.async);

                            statementPath.replaceWith(
                                t.callExpression(implicitProvideIdentifier, [anonymousFunction]));
                        }
                    } else {
                        statementPath.replaceWith(
                            t.callExpression(implicitProvideIdentifier, [statementPath.node.declaration]));
                    }
                } else {
                    const specifiers = statementPath.node.specifiers;
                    if (specifiers.length !== 1 || specifiers[0].exported.name !== 'default') {
                        throw statementPath.buildCodeFrameError('Only default exports are allowed.');
                    }

                    statementPath.replaceWith(t.callExpression(implicitProvideIdentifier, [specifiers[0].local]));
                }
            }
        }

        // Force modules to have exports.
        if (!hasExport && !explicitProvideIdentifier) {
            throw path.buildCodeFrameError('Module have no export and no provide import.');
        }

        // Append implicit imports added by other plugins.
        const ymModulesImports = Object.keys(this.file.ymImports)
            .map(name => ({ module: name, local: this.file.ymImports[name] }));

        imports.unshift(...ymModulesImports);

        // If someone imported helper explicitly then we'll have two util.defineClass imports, for example.
        // Leave only first import and transform next ones to simple assignment.
        const { declarations, imports: simplifiedImports } = squashImports(imports);
        path.unshiftContainer('body', declarations);

        const usedImports = simplifiedImports.filter(x => x.local);
        const unusedImports = simplifiedImports.filter(x => !x.local);

        const provideIdentifier = explicitProvideIdentifier || implicitProvideIdentifier;
        path.node.body = [
            buildYmDefine({
                MODULE_NAME: t.stringLiteral(getModuleName(this)),
                SOURCES: [].concat(
                    usedImports.map(x => t.stringLiteral(x.module)),
                    unusedImports.map(x => t.stringLiteral(x.module))
                ),
                BODY: path.node.body,
                PARAMS: [].concat([provideIdentifier], usedImports.map(x => x.local))
            })
        ];
    };

    return { visitor: { Program: { enter: onProgramEnter, exit: onProgramExit } } };
};
