module.exports = function (config) {
    config.set({
        basePath: './',
        frameworks: ['mocha', 'expect'],
        // list of files / patterns to load in the browser
        files: [
            'https://api-maps.yandex.ru/2.1/?lang=ru_RU&load=package.full,util.dom.style',
            { pattern: 'src/*.js', include: true },
            { pattern: 'test/*.js', include: true }
        ],
        exclude: [],
        preprocessors: {},
        reporters: ['progress'],
        port: 9876,
        colors: true,
        logLevel: config.LOG_INFO,
        autoWatch: false,
        browsers: ['ChromeHeadless'],
        singleRun: true
    });
};
