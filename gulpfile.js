var http = require('http');

var gulp = require('gulp');
var browserify = require('gulp-browserify');
var concat = require('gulp-concat');
var watch = require('gulp-watch');

var ecstatic = require('ecstatic');

var _ = require('lodash');

function ReloadBaked() {
  require('./ext/starts_with');
  _.each(require.cache, function (value, key) {
    if (key.startsWith(__dirname + '/src')) {
      delete require.cache[key];
    }
  });
  return require('./src/server');
}

var src_dir = 'to_generate';
var dst_dir = 'generated';
var build_dir = './build';
var libName = 'baked.js';

var baked = ReloadBaked();

gulp.task('generate:lib', function() {
  baked = ReloadBaked();
  gulp.src('src/browser.js')
    .pipe(browserify({
      options: {
        alias: ['./src/fake:canvas']
      }
    }))
    .pipe(concat(libName))
    .pipe(gulp.dest(build_dir));
});

gulp.task('generate:content', function () {
  baked.generate(src_dir, dst_dir, {async: true, debug: false});
});

gulp.task('copy-lib', ['generate:content'], function () {
  gulp.src(build_dir + '/' + libName).pipe(gulp.dest(dst_dir));
});

gulp.task('generate', ['generate:lib', 'copy-lib']);

gulp.task('serve', function() {
  var port = 8282;
  http.createServer(ecstatic({
    root: __dirname + '/' + dst_dir,
    baseDir: '/',
    cache: 1,
    showDir: false,
    autoIndex: true,
    defaultExt: 'html'
  })).listen(port);
  console.info("Listen connection on http://127.0.0.1:" + port);
});

gulp.task('watch:src', function () {
  gulp.watch('src/**/*.js', ['generate']);
});

gulp.task('watch:content', function () {
  gulp.watch(src_dir + '/**/*', ['generate:content']);
});

gulp.task('watch', ['watch:src', 'watch:content']);

gulp.task('default', ['generate', 'serve', 'watch']);
