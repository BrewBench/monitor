var gulp = require('gulp')
  , pipe = require('gulp-pipe')
  , debug = require('gulp-debug')
  , filter = require('gulp-filter')
  , concat = require('gulp-concat')
  , minifyCss = require('gulp-minify-css')
  , uglify = require('gulp-uglify')
  , ngAnnotate = require('gulp-ng-annotate');

gulp.task('css', function () {
  return pipe([gulp.src(['css/*'])
                ,filter('*.css')
                ,debug()
                ,concat('app.min.css')
                ,minifyCss({keepSpecialComments: 0})
                ,gulp.dest('./dist/')
              ])
              .on('error', function(e) { console.log(e); });
});

gulp.task('scripts', function(){

  var src = ['js/app.js','js/filters.js','js/services.js','js/controllers.js'];

  return pipe([gulp.src(src)
                ,filter('*.js')
                ,debug()
                ,concat('app.min.js')
                ,ngAnnotate()
                ,uglify({preserveComments:'some'})
                ,gulp.dest('./dist/')
              ])
              .on('error', function(e) { console.log(e); });
});

gulp.task('default', ['css', 'scripts']);
