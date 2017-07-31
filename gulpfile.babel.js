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
    src: [`${dirs.src}/styles/*.scss`
      ,'node_modules/angularjs-slider/dist/rzslider.scss'],
    dest: `${dirs.dest}/styles`
  },
  scripts: {
    src: `${dirs.src}/js/*.js`,
    dest: `${dirs.dest}/js`
  },
  vendor: {
    src: [`${dirs.src}/js/vendor/*.js`
      , 'node_modules/angularjs-slider/dist/rzslider.min.js'],
    dest: `${dirs.dest}/js`
  },
  assets: {
    src: [`${dirs.src}/assets/**/*`],
    dest: `${dirs.dest}/assets`
  },
  views: {
    src: [`${dirs.src}/views/*.html`],
    dest: `${dirs.dest}/views`
  }
};

gulp.task('clean', () => {
  util.log(`Removing build directory ${dirs.dest}`);
  return del([`${dirs.dest}`], {force: true});
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
    // .pipe(uglify())
    .pipe(gulp.dest(`${dirs.dest}`));
});

gulp.task('vendor', () => {
  util.log(`Building Vendor ${paths.vendor.src}`);
  return gulp.src(paths.vendor.src)
    // .pipe(babel({ presets: ['es2015']}).on('error', (err) => util.error(err)))
    .pipe(concat('js/vendor.js'))
    .pipe(uglify())
    .pipe(gulp.dest(`${dirs.dest}`));
});

gulp.task('assets', () => {
  util.log(`Building Assets ${paths.assets.src}`);
  return gulp.src(`${paths.assets.src}`)
    .pipe(gulp.dest(`${dirs.dest}/assets`));
});

gulp.task('views', () => {
  util.log(`Building Views ${paths.views.src}`);
  return gulp.src(`${paths.views.src}`)
    .pipe(gulp.dest(`${dirs.dest}/views`));
});

gulp.task('index', () => {
  return gulp.src([`${dirs.src}/index.html`,`${dirs.src}/favicon.ico`,`package.json`])
    .pipe(gulp.dest(`${dirs.dest}`));
});

gulp.task('serve', () => {
  browserSync.create().init({
    server: `${dirs.dest}`,
    port: 8080,
    logConnections: true,
    logFileChanges: true,
    files: [`${dirs.dest}/js/*.js`, `${dirs.dest}/styles/*.css`, `${dirs.dest}/views/*.html`, `${dirs.dest}/assets/*`],
    watchEvents: ['add', 'change']
  });

  gulp.watch(`${paths.styles.src[0]}`,['styles']).on('change', browserSync.reload);
  gulp.watch(`${paths.scripts.src}`,['scripts']).on('change', browserSync.reload);
  gulp.watch(`${paths.assets.src}`,['assets']).on('change', browserSync.reload);
  gulp.watch(`${paths.views.src}`,['views']).on('change', browserSync.reload);
  gulp.watch(`${dirs.src}/index.html`,['index']).on('change', browserSync.reload);
});

gulp.task('build', ['clean'], () => {
  gulp.start(['styles','scripts','vendor','assets','views','index']);
});

gulp.task('default', ['build'], () => {
  gulp.start(['serve']);
});
