#!/bin/sh

# Use browserify to package up source-map-support.js into source-map-support.browser.js
echo 'require("./source-map-support").install();' > .temp.js && \
echo '/*
 * Support for source maps in V8 stack traces
 * https://github.com/evanw/node-source-map-support
 */' > source-map-support.browser.js && \
browserify .temp.js | \
sed 's/\bbyte\b/bite/g' | \
sed 's/[[:<:]]byte[[:>:]]/bite/g' | \
sed 's/@license/license/g' | \
python -c 'import sys, urllib; sys.stdout.write("output_info=compiled_code&output_format=text&compilation_level=SIMPLE_OPTIMIZATIONS&js_code=" + urllib.quote(sys.stdin.read(), safe=""))' | \
curl -d @- 'http://closure-compiler.appspot.com/compile' >> source-map-support.browser.js && \
rm .temp.js
