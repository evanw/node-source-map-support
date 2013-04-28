require('./source-map-support').install();

var SourceMapGenerator = require('source-map').SourceMapGenerator;
var child_process = require('child_process');
var assert = require('assert');
var fs = require('fs');

function compareLines(actual, expected) {
  assert(actual.length >= expected.length, 'got ' + actual.length + ' lines but expected at least ' + expected.length + ' lines');
  for (var i = 0; i < expected.length; i++) {
    // Some tests are regular expressions because the output format changed slightly between node v0.9.2 and v0.9.3
    if (expected[i] instanceof RegExp) {
      assert(expected[i].test(actual[i]), JSON.stringify(actual[i]) + ' does not match ' + expected[i]);
    } else {
      assert.equal(actual[i], expected[i]);
    }
  }
}

function compareStackTrace(source, expected) {
  var sourceMap = new SourceMapGenerator({
    file: '.generated.js',
    sourceRoot: '.'
  });
  for (var i = 1; i <= 100; i++) {
    sourceMap.addMapping({
      generated: { line: i, column: 1 },
      original: { line: 1000 + i, column: 100 + i },
      source: 'line' + i + '.js'
    });
  }
  fs.writeFileSync('.generated.js.map', sourceMap);
  fs.writeFileSync('.generated.js', 'exports.test = function() {' +
    source.join('\n') + '};//@ sourceMappingURL=.generated.js.map');
  try {
    delete require.cache[require.resolve('./.generated')];
    require('./.generated').test();
  } catch (e) {
    compareLines(e.stack.split('\n'), expected);
  }
  fs.unlinkSync('.generated.js');
  fs.unlinkSync('.generated.js.map');
}

function compareStdout(done, source, expected) {
  var sourceMap = new SourceMapGenerator({
    file: '.generated.js',
    sourceRoot: '.'
  });
  sourceMap.addMapping({
    generated: { line: 1, column: 1 },
    original: { line: 1, column: 1 },
    source: '.original.js'
  });
  fs.writeFileSync('.original.js', 'this is the original code');
  fs.writeFileSync('.generated.js.map', sourceMap);
  fs.writeFileSync('.generated.js', source.join('\n') +
    '//@ sourceMappingURL=.generated.js.map');
  child_process.exec('node ./.generated', function(error, stdout, stderr) {
    try {
      compareLines((stdout + stderr).trim().split('\n'), expected);
    } catch (e) {
      return done(e);
    }
    fs.unlinkSync('.generated.js');
    fs.unlinkSync('.generated.js.map');
    fs.unlinkSync('.original.js');
    done();
  });
}

it('normal throw', function() {
  compareStackTrace([
    'throw new Error("test");'
  ], [
    'Error: test',
    /^    at Object\.exports\.test \(.*\/line1\.js:1001:101\)$/
  ]);
});

it('throw inside function', function() {
  compareStackTrace([
    'function foo() {',
    '  throw new Error("test");',
    '}',
    'foo();'
  ], [
    'Error: test',
    /^    at foo \(.*\/line2\.js:1002:102\)$/,
    /^    at Object\.exports\.test \(.*\/line4\.js:1004:104\)$/
  ]);
});

it('throw inside function inside function', function() {
  compareStackTrace([
    'function foo() {',
    '  function bar() {',
    '    throw new Error("test");',
    '  }',
    '  bar();',
    '}',
    'foo();'
  ], [
    'Error: test',
    /^    at bar \(.*\/line3\.js:1003:103\)$/,
    /^    at foo \(.*\/line5\.js:1005:105\)$/,
    /^    at Object\.exports\.test \(.*\/line7\.js:1007:107\)$/
  ]);
});

it('eval', function() {
  compareStackTrace([
    'eval("throw new Error(\'test\')");'
  ], [
    'Error: test',
    /^    at Object\.eval \(eval at <anonymous> \(.*\/line1\.js:1001:101\)/,
    /^    at Object\.exports\.test \(.*\/line1\.js:1001:101\)$/
  ]);
});

it('eval inside eval', function() {
  compareStackTrace([
    'eval("eval(\'throw new Error(\\"test\\")\')");'
  ], [
    'Error: test',
    /^    at Object\.eval \(eval at <anonymous> \(eval at <anonymous> \(.*\/line1\.js:1001:101\)/,
    /^    at Object\.eval \(eval at <anonymous> \(.*\/line1\.js:1001:101\)/,
    /^    at Object\.exports\.test \(.*\/line1\.js:1001:101\)$/
  ]);
});

it('eval inside function', function() {
  compareStackTrace([
    'function foo() {',
    '  eval("throw new Error(\'test\')");',
    '}',
    'foo();'
  ], [
    'Error: test',
    /^    at eval \(eval at foo \(.*\/line2\.js:1002:102\)/,
    /^    at foo \(.*\/line2\.js:1002:102\)/,
    /^    at Object\.exports\.test \(.*\/line4\.js:1004:104\)$/
  ]);
});

it('eval with sourceURL', function() {
  compareStackTrace([
    'eval("throw new Error(\'test\')//@ sourceURL=sourceURL.js");'
  ], [
    'Error: test',
    '    at Object.eval (sourceURL.js:1:7)',
    /^    at Object\.exports\.test \(.*\/line1\.js:1001:101\)$/
  ]);
});

it('eval with sourceURL inside eval', function() {
  compareStackTrace([
    'eval("eval(\'throw new Error(\\"test\\")//@ sourceURL=sourceURL.js\')");'
  ], [
    'Error: test',
    '    at Object.eval (sourceURL.js:1:7)',
    /^    at Object\.eval \(eval at <anonymous> \(.*\/line1\.js:1001:101\)/,
    /^    at Object\.exports\.test \(.*\/line1\.js:1001:101\)$/
  ]);
});

it('function constructor', function() {
  compareStackTrace([
    'throw new Function(")");'
  ], [
    'SyntaxError: Unexpected token )',
    /^    at Object\.Function \((?:unknown source|<anonymous>)\)$/,
    /^    at Object\.exports\.test \(.*\/line1\.js:1001:101\)$/,
  ]);
});

it('default options', function(done) {
  compareStdout(done, [
    '',
    'function foo() { throw new Error("this is the error"); }',
    'require("./source-map-support").install();',
    'process.nextTick(foo);',
    'process.nextTick(function() { process.exit(1); });'
  ], [
    /\/.original\.js:1$/,
    'this is the original code',
    '^',
    'Error: this is the error',
    /^    at foo \(.*\/.original\.js:1:1\)$/
  ]);
});

it('handleUncaughtExceptions is true', function(done) {
  compareStdout(done, [
    '',
    'function foo() { throw new Error("this is the error"); }',
    'require("./source-map-support").install({ handleUncaughtExceptions: true });',
    'process.nextTick(foo);'
  ], [
    /\/.original\.js:1$/,
    'this is the original code',
    '^',
    'Error: this is the error',
    /^    at foo \(.*\/.original\.js:1:1\)$/
  ]);
});

it('handleUncaughtExceptions is false', function(done) {
  compareStdout(done, [
    '',
    'function foo() { throw new Error("this is the error"); }',
    'require("./source-map-support").install({ handleUncaughtExceptions: false });',
    'process.nextTick(foo);'
  ], [
    /\/.generated.js:2$/,
    'function foo() { throw new Error("this is the error"); }',
    '                       ^',
    'Error: this is the error',
    /^    at foo \(.*\/.original\.js:1:1\)$/
  ]);
});
