#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const child_process = require('node:child_process');
const https = require('node:https');
const { text } = require('node:stream/consumers');

const browserify = path.resolve(path.join('node_modules', '.bin', 'browserify'));
const webpack = path.resolve(path.join('node_modules', '.bin', 'webpack'));
const coffee = path.resolve(path.join('node_modules', '.bin', 'coffee'));

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

  // Use the online Google Closure Compiler service for minification
  const body = new URLSearchParams({
    compilation_level: 'SIMPLE_OPTIMIZATIONS',
    output_info: 'compiled_code',
    output_format: 'text',
    js_code: code
  });

  const buffer = new TextEncoder().encode(body.toString())

  console.log('making request to google closure compiler');

  const request = https.request({
    method: 'POST',
    host: 'closure-compiler.appspot.com',
    path: '/compile',
    headers: {
      'content-length': buffer.byteLength,
      'content-type': 'application/x-www-form-urlencoded'
    },
  });

  request.once('response', response => {
    text(response).then(stdout => {
      fs.unlinkSync('.temp.js');

      if (response.statusCode !== 200) {
        console.error(stdout);
        throw new Error('failed to post to closure compiler');
      }

      const code = header + '\n' + stdout;
      fs.writeFileSync('browser-source-map-support.js', code);
      fs.writeFileSync('amd-test/browser-source-map-support.js', code);
    });
  });

  request.end(buffer);
});

// Build the AMD test
run(coffee + ' --map --compile amd-test/script.coffee', error => {
  if (error) throw error;
});

// Build the browserify test
run(coffee + ' --map --compile browserify-test/script.coffee', error => {
  if (error) throw error;
  run(browserify + ' --debug browserify-test/script.js > browserify-test/compiled.js', error => {
    if (error) throw error;
  })
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
