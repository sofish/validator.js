/* jshint node: true */

var gulp = require('gulp'),
    rename = require('gulp-rename'),
    uglify = require('gulp-uglifyjs'),
    clean = require('gulp-clean'),
    jshint = require('gulp-jshint'),
    stylish = require('jshint-stylish')


gulp.task('clean', function () {
  return gulp
          .src('./dist', { read: false })
          .pipe(clean({ force: true }))
})

gulp.task('build', ['clean'], function () {
  gulp
    .src('validator.js')
    .pipe(rename({
      suffix: '.min'
    }))
    .pipe(uglify({ outSourceMap: true }))
    .pipe(gulp.dest('./dist'))
})

gulp.task('lint', function () {
  gulp.src([
    'gulpfile.js',
    'validator.js'
    ]).pipe(jshint())
      .pipe(jshint.reporter(stylish))
})

gulp.task('default', ['build'])
