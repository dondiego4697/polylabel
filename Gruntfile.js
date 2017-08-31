module.exports = function (grunt) {
    const fileNames = [
        'config',
        'center/setCenter',
        'util/calculateArea',
        'util/checkPointPosition',
        'label/createLabel',
        'util/getPolesOfInaccessibility',
        'util/createDefaultLabelData',
        'zoom/setZoomVisibility',
        'zoom/parseZoomData',
        'util.polylabel'
    ];
    const babelFiles = fillFiles(fileNames);
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        babel: {
            options: {
                sourceMap: true
            },
            dist: {
                files: babelFiles
            }
        },
        concat: {
            build: {
                src: [
                    'build/pre/**/*.js'
                ],
                dest: 'build/util.polylabel.js'
            }
        },
        uglify: {
            build: {
                src: 'build/util.polylabel.js',
                dest: 'build/util.polylabel.min.js'
            }
        },
        watch: {
            files: 'src/*.js',
            tasks: 'default'
        }
    });

    grunt.loadNpmTasks('grunt-babel');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['babel', 'concat', 'uglify', 'watch']);
};

function fillFiles(names) {
    let result = {};
    names.forEach((fileName) => {
        result[`build/pre/${fileName}.ym.js`] = `src/${fileName}.js`;
    });
    return result;
}
