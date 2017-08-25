module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            build: {
                src: [
                    'src/calculateArea.min.js',
                    'src/checkPointPosition.js',
                    'src/getPolesOfInaccessibility.js',
                    'src/index.js'
                ],
                dest: 'build/util.polylabel1.js'
            },
            build1: {
                src: [
                    'src/calculateArea.min.js',
                    'src/checkPointPosition.js',
                    'src/getPolesOfInaccessibility.js',
                    'src/index2.js'
                ],
                dest: 'build/util.polylabel2.js'
            }
        },
        uglify: {
            build: {
                src: 'build/util.polylabel1.js',
                dest: 'build/util.polylabel.min.js'
            }
        },
        watch: {
            files: 'src/*.js',
            tasks: 'default'
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concat', 'uglify', 'watch']);
};
