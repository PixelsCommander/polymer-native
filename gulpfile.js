var BUNDLE_NAME = 'polymer-native',
    gulp = require('gulp'),
    gutil = require('gulp-util'),
    path = require('path'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglifyjs'),
    clean = require('gulp-clean'),
    copy = require('gulp-copy'),
    replace = require('gulp-replace'),
    watch = require('gulp-watch'),
    karma = require('karma'),
    sequence = require('gulp-sequence'),
    karmaParseConfig = require('karma/lib/config').parseConfig;

gulp.task('build', function () {
    gulp.src(['node_modules/webcomponents.js/webcomponents-lite.min.js', './libraries/js/src/pn-utils.js', './libraries/js/src/pn-base-element.js', './libraries/js/src/elements/*.js'])
        .pipe(concat(BUNDLE_NAME + '.js'))
        .pipe(gulp.dest('dist'))
        .pipe(uglify(BUNDLE_NAME + '.min.js'))
        .pipe(gulp.dest('dist'));
});

function runKarma(configFilePath, options, cb) {

    configFilePath = path.resolve(configFilePath);

    var server = karma.server;
    var log=gutil.log, colors=gutil.colors;
    var config = karmaParseConfig(configFilePath, {});

    Object.keys(options).forEach(function(key) {
        config[key] = options[key];
    });

    server.start(config, function(exitCode) {
        log('Karma has exited with ' + colors.red(exitCode));
        cb();
        process.exit(exitCode);
    });
}

/** actual tasks */

/** single run */
gulp.task('test', function(cb) {
    runKarma('karma.conf.js', {
        autoWatch: false,
        singleRun: true
    }, cb);
});

/** continuous ... using karma to watch (feel free to circumvent that;) */
gulp.task('test-dev', function(cb) {
    runKarma('karma.conf.js', {
        autoWatch: true,
        singleRun: false
    }, cb);
});

gulp.task('develop', function() {
    watch('./libraries/js/src/*.js', function(){
        gulp.run(['build'/*, 'test'*/])
    });
});

gulp.task('cleantemplate', function() {
    return gulp.src('./ios-generator/app/templates/project', {read: false})
        .pipe(clean());
});

gulp.task('insertvarsintemplate', function() {
    return gulp.src(path.join('./libraries/ios/polymer-native-template/','**/*'))
        .pipe(replace('polymer-native-template', '<%= name %>'))
        .pipe(gulp.dest('./ios-generator/app/templates/project'));
});

gulp.task('updatetemplate', function(){
    return sequence('cleantemplate', 'insertvarsintemplate');
});

gulp.task('default', ['test-dev', 'develop']);