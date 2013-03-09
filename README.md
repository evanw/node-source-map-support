# Source Map Support

This module provides source map support for stack traces in node via the [V8 stack trace API](http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi). It uses the [source-map](https://github.com/mozilla/source-map) module to replace the paths and line numbers of source-mapped files with their original paths and line numbers. The output mimics node's stack trace format with the goal of making every compile-to-JS language more of a first-class citizen. Source maps are completely general (not specific to any one language) so you can use source maps with multiple compile-to-JS languages in the same node process.

### Installation

    npm install source-map-support

This module takes effect globally and should be initialized by inserting `require('source-map-support').install()` at the top of your code.

### CoffeeScript Demo

The following terminal commands show a stack trace in node with CoffeeScript filenames:

    $ cat > demo.coffee

    require('source-map-support').install()
    foo = ->
      bar = -> throw new Error 'this is a demo'
      bar()
    foo()

    $ npm install source-map-support coffee-script
    $ node_modules/coffee-script/bin/coffee --map --compile demo.coffee
    $ node demo

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

### TypeScript Demo

The following terminal commands show a stack trace in node with TypeScript filenames:

    $ cat > demo.ts

    declare function require(name: string);
    require('source-map-support').install();
    class Foo {
      constructor() { this.bar(); }
      bar() { throw new Error('this is a demo'); }
    }
    new Foo();

    $ npm install source-map-support typescript
    $ node_modules/typescript/bin/tsc -sourcemap demo.ts
    $ node demo

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

### Options

This module installs two things: a change to the `stack` property on `Error` objects and a handler for uncaught exceptions that mimics node's default exception handler (the handler can be seen in the demos above). You may want to disable the handler if you have your own uncaught exception handler. This can be done by passing an argument to the installer:

    require('source-map-support').install({
      handleUncaughtExceptions: false
    });

### License

This code is available under the [MIT license](http://opensource.org/licenses/MIT).
