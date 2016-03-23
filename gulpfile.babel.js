var fs = require('fs'),
    gulp = require('gulp'),
    sourcemaps = require('gulp-sourcemaps'),
    babel = require('gulp-babel'),
    concat = require('gulp-concat'),
    wrap = require('gulp-wrap'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    filter = require('gulp-filter'),
    sass = require('gulp-sass'),
    cache = require('gulp-cached'),
    remember = require('gulp-remember'),
    deleteLines = require('gulp-delete-lines'),
    stream_queue = require('streamqueue'),
    minifyCss = require('gulp-minify-css'),
    prefix = require('gulp-autoprefixer'),

    src_path = 'src',

    src_files = [
        'app',
    ].map(to_src_path);

gulp.task('default', make_bundler(src_files, 'bundle.js'));

function make_bundler(src_files, bundle_file) {
    return function () {
        var output_dir = 'app/static/js/';

        var template_wrapper = (
            '\n// <%= file.relative %>\n' +
            'define_template("<%= file.relative %>", <%= contents %>);\n'
        );

        var javascript = gulp.src(src_files)
            .pipe(cache('js_source'))
            .pipe(babel())
            .on('error', handle_stream_error('Babel'))
            .pipe(deleteLines({
                'filters': [
                    /['"](format es6)|(use strict)['"];/g
                ]
            }))
            .pipe(remember('js_source'));

        return stream_queue.obj(
                javascript)
            .pipe(concat(bundle_file))
            .pipe(wrap(';(function(){\n"use strict";\n<%= contents %>\n}());'))
            .pipe(gulp.dest(output_dir))
            .pipe(uglify().on('error', handle_stream_error('Uglify')))
            .pipe(rename({suffix: '.min'}))
            .pipe(gulp.dest(output_dir));
    }
}

function handle_stream_error(error_name) {
    return function (e) {
        console.error('\n' + error_name + ':', e.name);
        console.error(e.message);
        this.end();
    };
}

function to_src_path(filename) {
    return 'src/js/' + filename + '.js';
}

gulp.task('watch', ['default', 'styles'], function () {
    gulp.watch(src_files, ['default']);
    gulp.watch('src/scss/*.scss', ['styles']);
    gulp.watch(ractive_component_template_files, ['default']);
});

var paths = {
    sass: 'src/scss/',
    css: 'static/css/'
};

gulp.task('styles', function(){
    gulp.src(src_path + '/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(prefix({
                browsers: ['last 2 versions'],
                cascade: false
            }))
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('static/css/'));
    gulp.src(src_path + '/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(prefix({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('static/css/'));
});
