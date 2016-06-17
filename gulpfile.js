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
    spawn = require('child_process').spawn,
    browserify = require('gulp-browserify');

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

gulp.task('cleanjs', function () {
    return gulp.src('./partials/js-library/dist/*.*')
        .pipe(clean());
});

gulp.task('compilejs', function () {
    return gulp.src('./partials/js-library/src/polymer-native.js')
        .pipe(browserify({
            insertGlobals: true,
            debug: true
        }))
        .pipe(gulp.dest('./partials/js-library/dist/'))
        .pipe(uglify(BUNDLE_NAME + '.min.js'))
        .pipe(gulp.dest('./partials/js-library/dist/'));
})

gulp.task('buildjs', function (done) {
    return sequence(
        'cleanjs',
        'compilejs',
        done
    );
});

/** BUILD IOS GENERATOR */

gulp.task('cleanweb', function () {
    return gulp.src('./partials/www/js/', {read: false})
        .pipe(clean());
});

gulp.task('copyjstoweb', function () {
    return gulp.src('./partials/js-library/dist/*.*')
        .pipe(copy('./partials/www/js/', {
            prefix: 3
        }));
});

gulp.task('cleaniosgen', function () {
    return gulp.src(['./ios-generator/app/templates/ios', './ios-generator/app/templates/www'], {read: false})
        .pipe(clean());
});

gulp.task('copyiostoiosgen', function () {
    return gulp.src(path.join('./partials/ios-template/', '**/*'))
        .pipe(replace('polymer-native-template', '<%= name %>'))
        .pipe(gulp.dest('./ios-generator/app/templates/ios'));
});

gulp.task('copywebtoiosgen', function () {
    return gulp.src(path.join('./partials/www/', '**/*'))
        .pipe(replace('polymer-native-template', '<%= name %>'))
        .pipe(gulp.dest('./ios-generator/app/templates/www'));
});

gulp.task('updateiosgen', function (done) {
    return sequence(
        'cleanweb',
        'cleaniosgen',
        'buildjs',
        'copyjstoweb',
        'copywebtoiosgen',
        'copyiostoiosgen',
        done
    );
});

/** DEV */

gulp.task('develop', function (done) {
    watch('./partials/js-library/src/**/*.js', function () {
        return gulp.run('updateiosgen');
    });

    watch(['./partials/www/index.html', './partials/www/css/*.css'], function () {
        return gulp.run('updateiosgen');
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
    return sequence('updateiosgen', 'bump', 'npm-publish', 'npm-install', function (cb) {
    });
});

gulp.task('default', ['updateiosgen', /* 'test-dev',*/ 'develop']);