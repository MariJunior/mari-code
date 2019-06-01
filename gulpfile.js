'use strict';

var gulp = require('gulp');
var del = require('del');
var htmlprettify = require('gulp-html-prettify');
var pug = require('gulp-pug');
var plumber = require('gulp-plumber');
var less = require('gulp-less');
var postcss = require('gulp-postcss');
var autoprefixer = require('autoprefixer');
var minify = require('gulp-csso');
var rename = require('gulp-rename');
var server = require('browser-sync').create();
var imagemin = require('gulp-imagemin');
var pump = require('pump');
var uglify = require('gulp-uglify');
var run = require('run-sequence');
// var lec = require ('gulp-line-ending-corrector');

// Удаление директории 'build'
gulp.task('clean', function() {
  return del('build');
});

// Копирование неизменяемых файлов шрифтов, изображений и иных из директории 'source' в директорию 'build'
gulp.task('copy', function() {
  return gulp.src([
    'source/fonts/**/*.{woff,woff2,eot,ttf}',
    'source/img/**'
  ], {
    base: 'source'
  })
      .pipe(gulp.dest('build'));
});

// Подключение плагина 'gulp-pug' и компиляция всех основных .pug файлов из директории 'source' в .html, их сохранение в директории 'build', последующая антиминификация и начало отслеживания изменений
gulp.task('html', function() {
  return gulp.src('source/pages/*.pug')
      .pipe(plumber())
      .pipe(pug())
      .pipe(htmlprettify({
        indent_char: ' ',
        indent_size: 2
      }))
      .pipe(gulp.dest('build'))
      .pipe(server.stream());
});

// Преобразование файлов стилей:
// 1. Получение основного файла стилей - 'style.less' из директории 'source/less'
// 2. Подключение 'gulp-plumber' для отслеживания возможных ошибок и формирования вывода сообщения о них (без прерывания работы таска)
// 3. Подключение 'gulp-less' для компиляции 'style.less' в 'style.css'
// 4. Подключение 'gulp-postcss' и его плагина 'autoprefixer' для добавления вендорных префиксов в нужных местах с учётом последних 4-х версий популярных браузеров
// 5. Сохранение полученного файла в директорию 'build/css'
// 6. Минификация стилей
// 7. Переименование минифицированного файла стилей в 'style.min.css'
// 8. Сохранение полученного файла в директорию 'build/css'
// 9. Подключение локального сервера с помощью 'browser-sync' и начало отслеживания изменений
gulp.task('style', function() {
  gulp.src('source/less/style.less')
      .pipe(plumber())
      .pipe(less())
      .pipe(postcss([
        autoprefixer({
          browsers: ['last 3 versions']
        })
      ]))
      .pipe(gulp.dest('build/css'))
      .pipe(minify())
      .pipe(rename('style.min.css'))
      .pipe(gulp.dest('build/css'))
      .pipe(server.stream());
});

// Оптимизация графики:
// 1. Получение всех файлов с расширениями '.jpg', '.png' и '.svg' из директории 'source/img' на любом уровне
// 2. Подключение 'gulp-imagemin' и его настройка: уровень сжатия png = 3 (из 10); для jpg использовать прогрессивное сжатие; для svg не удалять атрибут viewBox и запретить краткий формат записи hex-цветов
// 3. Сохранение преобразованных изображений в директиву 'build/img'
gulp.task('images', function() {
  return gulp.src(['source/img/**/*.{png,jpg,svg}'/* , '!source/img/sprite.svg' */])
    .pipe(imagemin([
      imagemin.optipng({optimizationLevel: 3}),
      imagemin.jpegtran({progressive: true}),
      imagemin.svgo({
        plugins: [
            {removeViewBox: false},
            {convertColors: {shorthex: false}}
        ]
      })
    ]))
    .pipe(gulp.dest('build/img'));
});

// Минификация всех .js файлов из директории 'source/js' с помошью 'gulp-uglify' и сохранение в директорию 'build/js'
gulp.task('js', function (cb) {
  pump([
        gulp.src('source/js/*.js'),
        uglify(),
        gulp.dest('build/js')
    ],
    cb
  );
});

// Подключение плагина 'run-sequence' для последовательного запуска задач
gulp.task('build', function(done) {
  run('clean', 'copy', 'html', 'style', 'js', done);
});

// Подключение плагина 'browser-sync' и начало отслеживания изменений файлов в директории 'build/', выполнения соотв. задач и перезагрузки страницы
gulp.task('serve', function () {
  server.init({
    // browser: 'google chrome',
    server: 'build/',
    notify: false,
    open: false,
    cors: true,
    ui: false
  });

  gulp.watch('source/pages/**/*.pug', ['html']).on('change', server.reload);
  gulp.watch('source/less/**/*.less', ['style']).on('change', server.reload);
  gulp.watch('source/js/*.js', ['copy']).on('change', server.reload);
  gulp.watch('source/img/*', ['images']).on('change', server.reload);
});

// Проверка и приведение концов строк всех файлов к \n (LF) для GitHub (ну и просто для единообразия)
// gulp.task('correct-line-ending', function() {
//     gulp.src(['./**/*', '!node_modules/**', '!source/img/**', '!build/img/**'])
//         .pipe(lec({
//           verbose: true,
//           eolc: 'LF',
//           encoding: 'utf8'
//         }))
//         .pipe(gulp.dest('./'));
// });
