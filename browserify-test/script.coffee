(require '../source-map-support').install()

foo = -> throw new Error 'foo'

try
  foo()
catch e
  if /\bscript\.coffee\b/.test e.stack
    document.write 'Test passed'
  else
    document.write 'Test failed'
    console.log e.stack
