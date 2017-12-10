/**
 * @file gulpfile
 * @author leon<ludafa@outlook.com>
 */

const gulp = require('gulp');
const atom = require('gulp-atom-compiler');

gulp.task('atom', () => {
    gulp
        .src('src/**/*.atom')
        .pipe(atom({}))
        .pipe(gulp.dest('output/template'));
});


gulp.task('default', ['atom']);
gulp.task('watch', () => {
    gulp.watch('src/**/*.atom', ['atom']);
});
