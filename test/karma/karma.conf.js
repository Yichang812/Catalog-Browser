'use strict';

// Karma configuration
// Generated on Sat Oct 05 2013 22:00:14 GMT+0700 (ICT)

module.exports = function(config) {
    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: '../../',


        // frameworks to use
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
            'public/lib/angular/angular.js',
            'public/lib/angular-mocks/angular-mocks.js',
            'public/lib/angular-cookies/angular-cookies.js',
            'public/lib/angular-resource/angular-resource.js',
            'public/lib/angular-route/angular-route.js',
            'public/lib/angular-bootstrap/ui-bootstrap-tpls.js',
            'public/lib/angular-bootstrap/ui-bootstrap.js',
            'public/lib/angular-ui-utils/ui-utils.js',
            'public/lib/angular-animate/angular-animate.js',
            'public/lib/underscore/underscore.js',
            'public/lib/ng-file-upload/angular-file-upload.js',
            'public/lib/ng-file-upload/angular-file-upload-shim.js',
            'public/lib/angularjs-scroll-glue/src/scrollglue.js',
            'public/lib/js-xls/xls.js',
            'public/lib/js-xlsx/xlsx.js',
            'public/js/app.js',
            'public/js/config.js',
            'public/js/directives.js',
            'public/js/filters.js',
            'public/js/services/global.js',
            'public/js/DataFileParser.js',
            'public/js/ui-select.js',
            'public/js/services/underscore.js',
            'public/js/services/usersAPI.js',
            'public/js/services/SchematicsAPI.js',
            'public/js/services/catalogAPI.js',
            'public/js/services/validateLinkMapping.js',
            'public/js/services/ParsingService.js',
            'public/js/services/formValidation.js',
            'public/js/services/boxSelect.js',
            'public/js/services/fileTypeEnum.js',
            'public/js/services/navBarMenu.js',
            'public/js/controllers/index.js',
            'public/js/controllers/header.js',
            'public/js/controllers/addStdFormCtrl.js',
            'public/js/controllers/ValidationCtrl.js',
            'public/js/controllers/addCompFormCtrl.js',
            'public/js/controllers/editCompFormCtrl.js',
            'public/js/controllers/editGrpFormCtrl.js',
            'public/js/controllers/editStdFormCtrl.js',
            'public/js/controllers/addGrpFormCtrl.js',
            'public/js/controllers/addCatalog.js',
            'public/js/controllers/catalogListCtrl.js',
            'public/js/controllers/filterModalCtrl.js',
            'public/js/controllers/editItemFormCtrl.js',
            'public/js/controllers/addCustomTypeModalCtrl.js',
            'public/js/controllers/matchFieldsModalCtrl.js',
            'public/js/controllers/catIconLinkModalCtrl.js',
            'public/js/init.js',
            'test/karma/unit/**/*.js'
        ],


        // list of files to exclude
        exclude: [

        ],


        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        //reporters: ['progress'],
        reporters: ['progress', 'coverage'],

        // coverage
        preprocessors: {
            // source files, that you wanna generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            'public/js/controllers/*.js': ['coverage'],
            'public/js/services/*.js': ['coverage']
        },

        

        coverageReporter: {
            type: 'html',
            dir: 'test/coverage/'
        },

        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: true,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: ['PhantomJS'],


        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true
    });
};