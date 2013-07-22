#!/bin/sh

coffee --map --compile script.coffee
browserify --debug script.js > compiled.js
