#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const child_process = require('node:child_process');
const https = require('node:https');
const { text } = require('node:stream/consumers');
var UglifyJS = require("uglify-js");

const browserify = path.resolve(path.join('node_modules', '.bin', 'browserify'));
const webpack = path.resolve(path.join('node_modules', '.bin', 'webpack'));
const coffee = path.resolve(path.join('node_modules', '.bin', 'coffee'));
const vite = path.resolve(path.join('node_modules', '.bin', 'vite'));

function run(command, callback) {
  console.log(command);
  child_process.exec(command, { maxBuffer: 25 * 1024 * 1024 }, callback);
}

// Use browserify to package up source-map-support.js
fs.writeFileSync('.temp.js', 'sourceMapSupport = require("./source-map-support");');

run(browserify + ' .temp.js', (error, stdout) => {
  if (error) throw error;

  // Wrap the code so it works both as a normal <script> module and as an AMD module
  const header = [
    '/*',
    ' * Support for source maps in V8 stack traces',
    ' * https://github.com/evanw/node-source-map-support',
    ' */',
  ].join('\n');

  const code = [
    '(this["define"] || function(name, callback) { this["sourceMapSupport"] = callback(); })("browser-source-map-support", function(sourceMapSupport) {',
    stdout.replace(/\bbyte\b/g, 'bite').replace(new RegExp(__dirname + '/', 'g'), '').replace(/@license/g, 'license'),
    'return sourceMapSupport});',
  ].join('\n');

  var result = UglifyJS.minify(code);

  if (result.error !== undefined) throw result.error;

  const codeMin = header + '\n' + result.code;
  fs.writeFileSync('browser-source-map-support.js', codeMin);
  fs.writeFileSync('amd-test/browser-source-map-support.js', codeMin);
});

// Build the AMD test
run(coffee + ' --map --compile amd-test/script.coffee', error => {
  if (error) throw error;
});

// Build the browserify test
run(browserify + ' -t coffeeify --debug browserify-test/script.coffee > browserify-test/compiled.js', error => {
  if (error) throw error;
});


// Build the browser test
run(coffee + ' --map --compile browser-test/script.coffee', error => {
  if (error) throw error;
});

// Build the header test
run(coffee + ' --map --compile header-test/script.coffee', error => {
  if (error) throw error;
  const contents = fs.readFileSync('header-test/script.js', 'utf8');
  fs.writeFileSync('header-test/script.js', contents.replace(/\/\/# sourceMappingURL=.*/g, ''))
});

// Build the webpack test
child_process.exec(webpack, {cwd: 'webpack-test'}, error => {
  if (error) throw error;
});

// Build the vite test
child_process.exec(vite + ' build --outDir ../', {cwd: 'vite-test/src'}, error => {
  if (error) throw error;
});

