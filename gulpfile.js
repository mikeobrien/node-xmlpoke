var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    mocha = require('gulp-mocha'),
    process = require('child_process');

gulp.task('default', ['test']);

gulp.task('lint', function() {
    return gulp.src(['**/*.js', '!node_modules/**/*'])
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
        .pipe(jshint.reporter('fail'));
});

gulp.task('test', ['lint'], function() {
    return gulp.src('test/*.js', { read: false })
        .pipe(mocha({ reporter: 'spec' }));
});

gulp.task('watch', function() {
    gulp.watch(['test/*.js', 'src/*.js'], function() {
        process.spawn('gulp', ['test'], { stdio: 'inherit' });
    });
});