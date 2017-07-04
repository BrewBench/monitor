// Karma configuration
// Generated on Tue Jul 04 2017 12:40:22 GMT-0600 (MDT)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['jasmine'],


    // list of files / patterns to load in the browser
    files: [
      'https://ajax.googleapis.com/ajax/libs/angularjs/1.5.8/angular.min.js',
      'https://ajax.googleapis.com/ajax/libs/angularjs/1.5.8/angular-touch.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/angular-nvd3/1.0.5/angular-nvd3.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/angular-ui-router/1.0.0/angular-ui-router.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/angular-scroll/1.0.0/angular-scroll.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/d3/3.5.12/d3.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/nvd3/1.8.1/nv.d3.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.10.6/moment.min.js',
      'https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.4/lodash.min.js',
      './node_modules/angular-mocks/angular-mocks.js',                 // loads our modules for tests
      './build/js/vendor.js',
      './build/js/app.js',
      './test/*.spec.js'
  ],


    // list of files to exclude
    exclude: [
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['spec'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
