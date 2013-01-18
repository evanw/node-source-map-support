require('./source-map-support');

var SourceMapGenerator = require('source-map').SourceMapGenerator;
var assert = require('assert');
var fs = require('fs');

// Create a source map
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

function compareStackTrace(source, expected) {
  fs.writeFileSync('.generated.js.map', sourceMap);
  fs.writeFileSync('.generated.js', 'exports.test = function() {' +
    source.join('\n') + '};//@ sourceMappingURL=.generated.js.map');
  try {
    delete require.cache[require.resolve('./.generated')];
    require('./.generated').test();
  } catch (e) {
    expected = expected.join('\n');
    assert.equal(e.stack.slice(0, expected.length), expected);
  }
  fs.unlinkSync('.generated.js');
  fs.unlinkSync('.generated.js.map');
}

it('normal throw', function() {
  compareStackTrace([
    'throw new Error("test");'
  ], [
    'Error: test',
    '    at Object.exports.test (./line1.js:1001:101)'
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
    '    at foo (./line2.js:1002:102)',
    '    at Object.exports.test (./line4.js:1004:104)'
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
    '    at bar (./line3.js:1003:103)',
    '    at foo (./line5.js:1005:105)',
    '    at Object.exports.test (./line7.js:1007:107)'
  ]);
});

it('eval', function() {
  compareStackTrace([
    'eval("throw new Error(\'test\')");'
  ], [
    'Error: test',
    '    at Object.eval (eval at <anonymous> (./line1.js:1001:101))',
    '    at Object.exports.test (./line1.js:1001:101)'
  ]);
});

it('eval inside eval', function() {
  compareStackTrace([
    'eval("eval(\'throw new Error(\\"test\\")\')");'
  ], [
    'Error: test',
    '    at Object.eval (eval at <anonymous> (eval at <anonymous> (./line1.js:1001:101)))',
    '    at Object.eval (eval at <anonymous> (./line1.js:1001:101))',
    '    at Object.exports.test (./line1.js:1001:101)'
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
    '    at eval (eval at foo (./line2.js:1002:102))',
    '    at foo (./line2.js:1002:102)',
    '    at Object.exports.test (./line4.js:1004:104)'
  ]);
});

it('eval with sourceURL', function() {
  compareStackTrace([
    'eval("throw new Error(\'test\')//@ sourceURL=sourceURL.js");'
  ], [
    'Error: test',
    '    at Object.eval (sourceURL.js:1:7)',
    '    at Object.exports.test (./line1.js:1001:101)'
  ]);
});

it('eval with sourceURL inside eval', function() {
  compareStackTrace([
    'eval("eval(\'throw new Error(\\"test\\")//@ sourceURL=sourceURL.js\')");'
  ], [
    'Error: test',
    '    at Object.eval (sourceURL.js:1:7)',
    '    at Object.eval (eval at <anonymous> (./line1.js:1001:101))',
    '    at Object.exports.test (./line1.js:1001:101)'
  ]);
});
