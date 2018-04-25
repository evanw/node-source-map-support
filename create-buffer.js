var newBuffer = (function(){
  try {
    // Use Buffer.from for newer Node versions
    Buffer.from('', 'utf8');
    return Buffer.from;
  } catch(e) {
    // Use new Buffer() for old Node versions
    return function(a, b, c) {
      return new Buffer(a, b, c);
    }
  }
})();

module.exports = newBuffer;
