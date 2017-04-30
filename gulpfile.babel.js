'use strict';

import gulp from 'gulp';
import uglify from 'gulp-uglify';
import sass from 'gulp-sass';
import babel from 'gulp-babel';
import util from 'gulp-util';
import concat from 'gulp-concat';
import del from 'del';
import autoprefixer from 'gulp-autoprefixer';
import sourcemaps from 'gulp-sourcemaps';
import browserSync from 'browser-sync';

const dirs = {
  src: './src',
  dest: './build'
};

const paths = {
  styles: {
    src: `${dirs.src}/styles/*.scss`,
    dest: `${dirs.dest}/styles`
  },
  scripts: {
    src: `${dirs.src}/js/*.js`,
    dest: `${dirs.dest}/js`
  },
  vendor: {
    src: `${dirs.src}/js/vendor/*.js`,
    dest: `${dirs.dest}/js`
  },
  assets: {
    src: [`${dirs.src}/assets/**/*`],
    dest: `${dirs.dest}/assets`
  }
};

gulp.task('clean', () => {
  util.log(`Removing build directory ${dirs.build}`);
  return del(`${dirs.build}`, {force: true});
});

gulp.task('styles', () => {
  util.log(`Building Styles ${paths.styles.src}`);
  return gulp.src(paths.styles.src)
    .pipe(sourcemaps.init())
    .pipe(sass.sync())
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('.'))
    .pipe(concat('styles/app.css'))
    .pipe(gulp.dest(`${dirs.dest}`));
});

gulp.task('scripts', () => {
  util.log(`Building Scripts ${paths.scripts.src}`);
  return gulp.src(paths.scripts.src)
    .pipe(babel({ presets: ['es2015']}).on('error', (err) => util.error(err)))
    .pipe(concat('js/app.js'))
    .pipe(uglify())
    .pipe(gulp.dest(`${dirs.dest}`));
});

gulp.task('vendor', () => {
  util.log(`Building Vendor ${paths.vendor.src}`);
  return gulp.src(paths.vendor.src)
    .pipe(babel({ presets: ['es2015']}).on('error', (err) => util.error(err)))
    .pipe(concat('js/vendor.js'))
    .pipe(uglify())
    .pipe(gulp.dest(`${dirs.dest}`));
});

gulp.task('assets', () => {
  util.log(`Building Assets ${paths.assets.src}`);
  return gulp.src(`${paths.assets.src}`)
    .pipe(gulp.dest(`${dirs.dest}/assets`));
});

gulp.task('index', () => {
  return gulp.src(`${dirs.src}/index.html`)
    .pipe(gulp.dest(`${dirs.dest}`));
});

gulp.task('watch', () => {
	gulp.watch(`${paths.styles.src}`,['styles']);
  gulp.watch(`${paths.scripts.src}`,['scripts','vendor']);
  gulp.watch(`${paths.assets.src}`,['assets']);
  gulp.watch(`${dirs.src}/index.html`,['index']);
});

gulp.task('serve', () => {
  browserSync.create().init({
    server: `${dirs.dest}`,
    port: 8080,
    logConnections: true,
    logFileChanges: true,
    files: [`${dirs.build}/js/*.js`, `${dirs.build}/styles/*.css`, `${dirs.build}/assets/*`]
  });
});

gulp.task('default', ['clean','styles','scripts','vendor','assets','index','watch','serve']);
