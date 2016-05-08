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
    karmaParseConfig = require('karma/lib/config').parseConfig,
    bump = require('gulp-bump'),
    spawn = require('child_process').spawn;

function runKarma(configFilePath, options, cb) {

    configFilePath = path.resolve(configFilePath);

    var server = karma.server;
    var log = gutil.log, colors = gutil.colors;
    var config = karmaParseConfig(configFilePath, {});

    Object.keys(options).forEach(function (key) {
        config[key] = options[key];
    });

    server.start(config, function (exitCode) {
        log('Karma has exited with ' + colors.red(exitCode));
        cb();
        process.exit(exitCode);
    });
}

/** TESTING */

gulp.task('test', function (cb) {
    runKarma('karma.conf.js', {
        autoWatch: false,
        singleRun: true
    }, cb);
});

gulp.task('test-dev', function (cb) {
    runKarma('karma.conf.js', {
        autoWatch: true,
        singleRun: false
    }, cb);
});

/** BUILD JS */

gulp.task('buildjs', function () {
    gulp.src(['node_modules/webcomponents.js/webcomponents-lite.min.js', './partials/js-library/src/pn-utils.js', './partials/js-library/src/pn-base-element.js', './partials/js-library/src/elements/*.js'])
        .pipe(concat(BUNDLE_NAME + '.js'))
        .pipe(gulp.dest('./partials/js-library/dist/'))
        .pipe(uglify(BUNDLE_NAME + '.min.js'))
        .pipe(gulp.dest('./partials/js-library/dist/'));
});

/** BUILD IOS GENERATOR */

gulp.task('copyjstoweb', function () {
    return gulp.src('./partials/js-library/dist/*.*')
        .pipe(copy('./partials/www/js/', {
            prefix: 3
        }));
});

gulp.task('cleaniosgen', function () {
    return gulp.src('./ios-generator/app/templates/project', {read: false})
        .pipe(clean());
});

gulp.task('cleanwebgen', function () {
    return gulp.src('./ios-generator/app/templates/web', {read: false})
        .pipe(clean());
});

gulp.task('copyiostoiosgen', function () {
    return gulp.src(path.join('./partials/ios-template/', '**/*'))
        .pipe(replace('polymer-native-template', '<%= name %>'))
        .pipe(gulp.dest('./ios-generator/app/templates/project'));
});

gulp.task('copywebtoiosgen', function () {
    return gulp.src('./partials/www/**/*')
        .pipe(copy('./ios-generator/app/templates/web', {
            prefix: 2
        }));
});

gulp.task('updateiosgenerator', function () {
    return sequence(
        'cleaniosgen',
        'cleanwebgen',
        'buildjs',
        'copyjstoweb',
        'copywebtoiosgen',
        'copyiostoiosgen',
        function (cb) {
        }
    );
});

/** DEV */

gulp.task('develop', function () {
    watch('./partials/js-library/src/*.js', function () {
        return gulp.run('buildjs');
    });
});

gulp.task('bump', function () {
    return gulp.src('./package.json')
        .pipe(bump({type: 'patch'}))
        .pipe(gulp.dest('./'));
});

gulp.task('npm-publish', function (done) {
    return spawn('npm', ['publish'], {stdio: 'inherit'}).on('close', done);
});

gulp.task('npm-install', function (done) {
    return spawn('npm', ['install', 'polymer-native', '-g'], {stdio: 'inherit'}).on('close', done);
});

gulp.task('release', function () {
    return sequence('updateiosgenerator' ,'bump', 'npm-publish', 'npm-install', function (cb) {
    });
});

gulp.task('default', ['test-dev', 'develop']);