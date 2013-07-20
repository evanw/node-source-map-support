# Source Map Support

This module provides source map support for stack traces in node via the [V8 stack trace API](http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi). It uses the [source-map](https://github.com/mozilla/source-map) module to replace the paths and line numbers of source-mapped files with their original paths and line numbers. The output mimics node's stack trace format with the goal of making every compile-to-JS language more of a first-class citizen. Source maps are completely general (not specific to any one language) so you can use source maps with multiple compile-to-JS languages in the same node process.

## Installation and Usage

    npm install source-map-support

Source maps can be generated using libraries such as [source-map-index-generator](https://github.com/twolfson/source-map-index-generator). Once you have a valid source map, insert the following two lines at the top of your compiled code:

    //# sourceMappingURL=path/to/source.map
    require('source-map-support').install();

The path should either be absolute or relative to the compiled file.

## Options

This module installs two things: a change to the `stack` property on `Error` objects and a handler for uncaught exceptions that mimics node's default exception handler (the handler can be seen in the demos below). You may want to disable the handler if you have your own uncaught exception handler. This can be done by passing an argument to the installer:

    require('source-map-support').install({
      handleUncaughtExceptions: false
    });

This module loads source maps from the filesystem by default. You can provide alternate loading behavior through a callback as shown below. For example, [Meteor](https://github.com/meteor) keeps all source maps cached in memory to avoid disk access.

    require('source-map-support').install({
      retrieveSourceMap: function(source) {
        if (source === 'compiled.js') {
          return {
            url: 'original.js',
            map: fs.readFileSync('compiled.js.map', 'utf8')
          };
        }
        return null;
      }
    });

## Demos

### Basic Demo

original.js:

    throw new Error('test'); // This is the original code

compiled.js:

    //# sourceMappingURL=compiled.js.map
    require('source-map-support').install();

    throw new Error('test'); // This is the compiled code

compiled.js.map:

    {
      "version": 3,
      "file": "compiled.js",
      "sources": ["original.js"],
      "names": [],
      "mappings": ";;;AAAA,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC,CAAC"
    }

Run compiled.js using node (notice how the stack trace uses original.js instead of compiled.js):

    $ node compiled.js

    original.js:1
    throw new Error("test"); // This is the original code
          ^
    Error: test
        at Object.<anonymous> (original.js:1:7)
        at Module._compile (module.js:449:26)
        at Object.Module._extensions..js (module.js:467:10)
        at Module.load (module.js:356:32)
        at Function.Module._load (module.js:312:12)
        at Module.runMain (module.js:492:10)
        at process.startup.processNextTick.process._tickCallback (node.js:244:9)

### TypeScript Demo

demo.ts:

    declare function require(name: string);
    require('source-map-support').install();
    class Foo {
      constructor() { this.bar(); }
      bar() { throw new Error('this is a demo'); }
    }
    new Foo();

Compile and run the file using the TypeScript compiler from the terminal:

    $ npm install source-map-support typescript
    $ node_modules/typescript/bin/tsc -sourcemap demo.ts
    $ node demo.js

    demo.ts:6
      bar() { throw new Error('this is a demo'); }
                   ^
    Error: this is a demo
        at Foo.bar (demo.ts:6:16)
        at new Foo (demo.ts:5:23)
        at Object.<anonymous> (demo.ts:8)
        at Module._compile (module.js:449:26)
        at Object.Module._extensions..js (module.js:467:10)
        at Module.load (module.js:356:32)
        at Function.Module._load (module.js:312:12)
        at Module.runMain (module.js:492:10)
        at process.startup.processNextTick.process._tickCallback (node.js:244:9)

### CoffeeScript Demo

demo.coffee:

    require('source-map-support').install()
    foo = ->
      bar = -> throw new Error 'this is a demo'
      bar()
    foo()

Compile and run the file using the CoffeeScript compiler from the terminal:

    $ npm install source-map-support coffee-script
    $ node_modules/coffee-script/bin/coffee --map --compile demo.coffee
    $ node demo.js

    demo.coffee:4
      bar = -> throw new Error 'this is a demo'
                        ^
    Error: this is a demo
        at bar (demo.coffee:4:21)
        at foo (demo.coffee:5:3)
        at Object.<anonymous> (demo.coffee:6)
        at Object.<anonymous> (demo.coffee:2)
        at Module._compile (module.js:449:26)
        at Object.Module._extensions..js (module.js:467:10)
        at Module.load (module.js:356:32)
        at Function.Module._load (module.js:312:12)
        at Module.runMain (module.js:492:10)
        at process.startup.processNextTick.process._tickCallback (node.js:244:9)

## License

This code is available under the [MIT license](http://opensource.org/licenses/MIT).
