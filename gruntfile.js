'use strict';

module.exports = function(grunt) {
    // Project Configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            jade: {
                files: ['app/views/**'],
                options: {
                    livereload: true,
                },
            },
            js: {
                files: ['gruntfile.js', 'server.js', 'app/**/*.js', 'public/js/**', 'test/**/*.js'],
                tasks: ['jshint'],
                options: {
                    livereload: true,
                },
            },
            html: {
                files: ['public/views/**'],
                options: {
                    livereload: true,
                },
            },
            css: {
                files: ['public/css/**'],
                options: {
                    livereload: true
                }
            }
        },
        jshint: {
            all: {
                src: ['gruntfile.js', 'server.js', 'app/**/*.js', 'public/js/**', 'test/mocha/**/*.js'],
                options: {
                    jshintrc: true
                }
            }
        },
        nodemon: {
            dev: {
                options: {
                    file: 'server.js',
                    args: [],
                    ignoredFiles: ['public/**'],
                    watchedExtensions: ['js'],
                    nodeArgs: ['--debug'],
                    delayTime: 1,
                    env: {
                        PORT: 3000
                    },
                    cwd: __dirname
                }
            },
            production: {
                options: {
                    file: 'server.js',
                    args: [],
                    ignoredFiles: ['public/**'],
                    watchedExtensions: ['js'],
                    nodeArgs: [],
                    delayTime: 1,
                    env: {
                        PORT: 80
                    },
                    cwd: __dirname
                }
            }
        },
        'node-inspector': {
            dev: {}
        },
        concurrent: {
            tasks: ['nodemon:dev', 'node-inspector', 'watch'],
			prodtasks: ['nodemon:production', 'watch'],
            options: {
                logConcurrentOutput: true
            }
        },
        mochaTest: {
            options: {
                reporter: 'XUnit',
                require: 'server.js',
				captureFile: 'test/test-results-mocha.xml'
            },
            src: ['test/mocha/**/*.js']
		},
        env: {
            test: {
                NODE_ENV: 'test'
            },
			prod: {
                NODE_ENV: 'production'
            }
        },
        karma: {
            unit: {
                configFile: 'test/karma/karma.conf.js',
				browsers: ['PhantomJS'],
				reporters: ['dots', 'junit'],
				junitReporter: {
					outputFile: 'test/test-results.xml'
				}
            }
        }
    });

    //Load NPM tasks
    grunt.loadNpmTasks('grunt-node-inspector');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-nodemon');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-env');

    //Making grunt default to force in order not to break the project.
    //Tao: commenting this, now we will know who broke the build.
    //grunt.option('force', true);

    //Default task(s).
    grunt.registerTask('default', ['jshint', 'concurrent:tasks']);

	//deploy
	grunt.registerTask('deploy', ['env:prod', 'jshint', 'concurrent:prodtasks']);
	
    //Test task.
    grunt.registerTask('test', ['env:test', 'mochaTest', 'karma:unit']);

    grunt.registerTask('karma_test', ['env:test', 'karma:unit']);


    grunt.registerTask('travis', ['env:test', 'jshint', 'mochaTest', 'karma:unit']);
};
