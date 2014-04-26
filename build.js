#!/usr/bin/env node

var fs = require('fs');
var querystring = require('querystring');
var child_process = require('child_process');

// Use browserify to package up source-map-support.js
fs.writeFileSync('.temp.js', 'sourceMapSupport = require("./source-map-support");');
child_process.exec('node_modules/browserify/bin/cmd.js .temp.js', function(error, stdout) {
  if (error) throw error;

  // Wrap the code so it works both as a normal <script> module and as an AMD module
  var header = [
    '/*',
    ' * Support for source maps in V8 stack traces',
    ' * https://github.com/evanw/node-source-map-support',
    ' */',
  ].join('\n');
  var code = [
    '(this["define"] || function(name, callback) { this["sourceMapSupport"] = callback(); })("browser-source-map-support", function(sourceMapSupport) {',
    stdout.replace(/\bbyte\b/g, 'bite').replace(new RegExp(__dirname + '/', 'g'), '').replace(/@license/g, 'license'),
    'return sourceMapSupport});',
  ].join('\n');

  // Use the online Google Closure Compiler service for minification
  fs.writeFileSync('.temp.js', querystring.stringify({
    compilation_level: 'SIMPLE_OPTIMIZATIONS',
    output_info: 'compiled_code',
    output_format: 'text',
    js_code: code
  }));
  child_process.exec('curl -d @.temp.js "http://closure-compiler.appspot.com/compile"', function(error, stdout) {
    if (error) throw error;
    var code = header + '\n' + stdout;
    fs.unlinkSync('.temp.js');
    fs.writeFileSync('browser-source-map-support.js', code);
    fs.writeFileSync('amd-test/browser-source-map-support.js', code);
  });
});

// Build the AMD test
child_process.exec('node_modules/coffee-script/bin/coffee --map --compile amd-test/script.coffee', function(error) {
  if (error) throw error;
});

// Build the browserify test
child_process.exec('node_modules/coffee-script/bin/coffee --map --compile browserify-test/script.coffee', function(error) {
  if (error) throw error;
  child_process.exec('node_modules/browserify/bin/cmd.js --debug browserify-test/script.js > browserify-test/compiled.js', function(error) {
    if (error) throw error;
  })
});

// Build the browser test
child_process.exec('node_modules/coffee-script/bin/coffee --map --compile browser-test/script.coffee', function(error) {
  if (error) throw error;
});
