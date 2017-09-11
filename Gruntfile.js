const glob = require("glob");
module.exports = function (grunt) {
    const fileNames = glob.sync("src/**/*.js");
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
    names = names.map(name => {
        return name.split('/').slice(1).join('/');
    });
    let result = {};
    names.forEach((fileName) => {
        result[`build/pre/${fileName}`] = `src/${fileName}`;
    });
    return result;
}
