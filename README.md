# Source Map Support

This module provides source map support for stack traces in node via the [V8 stack trace API](http://code.google.com/p/v8/wiki/JavaScriptStackTraceApi). It uses the [source-map](https://github.com/mozilla/source-map) module to replace the paths and line numbers of source-mapped files with their original paths and line numbers. The output mimics node's stack trace format with the goal of making every compile-to-JS language more of a first-class citizen.

### Installation

    npm install source-map-support

This module takes effect globally and should be initialized by inserting a call to require('source-map-support') at the top of your code.

### CoffeeScript Demo

The following terminal commands show a stack trace in node with CoffeeScript filenames:

    $ cat > demo.coffee

    require 'source-map-support'
    foo = ->
      bar = -> throw new Error 'this is a demo'
      bar()
    foo()

    $ npm install source-map-support
    $ git clone https://github.com/michaelficarra/CoffeeScriptRedux.git
    $ cd CoffeeScriptRedux && npm install && cd ..
    $ CoffeeScriptRedux/bin/coffee --js -i demo.coffee > demo.js
    $ echo '//@ sourceMappingURL=demo.js.map' >> demo.js
    $ CoffeeScriptRedux/bin/coffee --source-map -i demo.coffee > demo.js.map
    $ node demo

    demo.coffee:4
      bar = -> throw new Error 'this is a demo'
                      ^
    Error: this is a demo
        at bar (demo.coffee:4:19)
        at foo (demo.coffee:5:3)
        at Object.<anonymous> (demo.coffee:6:3)
        at Object.<anonymous> (demo.coffee:6:6)
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
    require('source-map-support');
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

### License

This code is available under the [MIT license](http://opensource.org/licenses/MIT).
