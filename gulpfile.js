/* global exports process */
/* eslint-disable no-console */
'use strict';

const {series, parallel, src, dest, watch} = require('gulp');
const path = require('path');
// const gulp = require('gulp');
const del = require('del');
const htmlprettify = require('gulp-html-prettify');
const pug = require('gulp-pug');
const plumber = require('gulp-plumber');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const minify = require('gulp-csso');
const rename = require('gulp-rename');
const server = require('browser-sync').create();
const imagemin = require('gulp-imagemin');
const pump = require('pump');
const uglify = require('gulp-uglify');
const ghpages = require('gh-pages');
// const through2 = require('through2');
// const lec = require ('gulp-line-ending-corrector');

// Удаление директории 'build'
function clean() {
  return del('build');
}

// Копирование неизменяемых файлов шрифтов, изображений и иных из директории 'source' в директорию 'build'
function copy() {
  return src([
    'source/fonts/**/*.{woff,woff2,eot,ttf}',
    // 'source/img/**'
  ], {
    base: 'source'
  })
    .pipe(dest('build'));
}

// Подключение плагина 'gulp-pug' и компиляция всех основных .pug файлов из директории 'source' в .html, их сохранение в директории 'build', последующая антиминификация и начало отслеживания изменений
function html() {
  return src('source/pages/*.pug')
    .pipe(plumber())
    .pipe(pug())
    .pipe(htmlprettify({
      indent_char: ' ',
      indent_size: 2
    }))
    .pipe(dest('build'))
    .pipe(server.stream());
}

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
function style() {
  return src('source/less/style.less')
    .pipe(plumber())
    .pipe(less())
    .pipe(postcss([
      autoprefixer({
        browsers: ['last 3 versions']
      })
    ]))
    .pipe(dest('build/css'))
    .pipe(minify())
    .pipe(rename('style.min.css'))
    .pipe(dest('build/css'))
    .pipe(server.stream());
}

// Оптимизация графики:
// 1. Получение всех файлов с расширениями '.jpg', '.png' и '.svg' из директории 'source/img' на любом уровне
// 2. Подключение 'gulp-imagemin' и его настройка: уровень сжатия png = 3 (из 10); для jpg использовать прогрессивное сжатие; для svg не удалять атрибут viewBox и запретить краткий формат записи hex-цветов
// 3. Сохранение преобразованных изображений в директиву 'build/img'
function images() {
  return src(['source/img/**/*.{png,jpg,svg}'/* , '!source/img/sprite.svg' */])
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
    .pipe(dest('build/img'));
}

// Минификация всех .js файлов из директории 'source/js' с помошью 'gulp-uglify' и сохранение в директорию 'build/js'
function js(cb) {
  pump([
        src('source/js/*.js'),
        uglify(),
        dest('build/js')
    ],
    cb
  );
}

function reload(done) {
  server.reload();
  done();
}

function deploy(cb) {
  ghpages.publish(path.join(process.cwd(), './build'), cb);
}

// Подключение плагина 'browser-sync' и начало отслеживания изменений файлов в директории 'build/', выполнения соотв. задач и перезагрузки страницы
function serve() {
  server.init({
    // browser: 'google chrome',
    server: 'build/',
    startPath: 'index.html',
    notify: false,
    open: false,
    cors: true,
    ui: false
  });

  watch(['source/pages/**/*.pug'], { events: ['all'], delay: 100 }, series(
    html,
    reload
  ));
  watch(['source/less/**/*.less'], { events: ['all'], delay: 100 }, series(
    style,
    reload
  ));
  watch(['source/js/*.js'], { events: ['all'], delay: 100 }, series(
    js,
    reload
  ));
  watch(['source/img/*'], { events: ['all'], delay: 100 }, series(
    images,
    reload
  ))
}

exports.clean = clean;
exports.copy = copy;
exports.html = html;
exports.style = style;
exports.images = images;
exports.js = js;
exports.deploy = deploy;

exports.build = series(
  clean,
  parallel(copy, images),
  parallel(html, style, js)
);

exports.default = series(
  clean,
  parallel(copy, images),
  parallel(html, style, js),
  serve
);

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
