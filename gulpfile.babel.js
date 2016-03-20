var fs = require('fs');
var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var babel = require('gulp-babel');
var concat = require('gulp-concat');
var wrap = require('gulp-wrap');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var filter = require('gulp-filter');
var sass = require('gulp-sass');
var cache = require('gulp-cached');
var remember = require('gulp-remember');
var deleteLines = require('gulp-delete-lines');
var stream_queue = require('streamqueue');
var minifyCss = require('gulp-minify-css');
var prefix = require('gulp-autoprefixer');

var client_src_path = 'app/client_src';

var src_files = [
    'app',
].map(to_client_src_path);

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

function to_client_src_path(filename) {
    return 'app/client_src/js/' + filename + '.js';
}

gulp.task('watch', ['default', 'styles'], function () {
    gulp.watch(src_files, ['default']);
    gulp.watch('app/client_src/scss/*.scss', ['styles']);
    gulp.watch(ractive_component_template_files, ['default']);
});

var paths = {
    sass: 'app/client_src/scss/',
    css: 'app/static/css/'
};

gulp.task('styles', function(){
    gulp.src(client_src_path + '/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(prefix({
                browsers: ['last 2 versions'],
                cascade: false
            }))
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest('app/static/css/'));
    gulp.src(client_src_path + '/scss/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(prefix({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('app/static/css/'));
});
