var SCOPE = require( '../../util/constants.js' ).SCOPE ;

module.exports.parseSuper = function() {
  var n = {
    type: 'Super',
    loc: { start: this.locBegin(), end: this.loc() },
    start: this.c0 , end: this.c
  };

  this.next() ;

  switch ( this.lttype ) {
  case '(':
    this.assert(this.scopeFlags & SCOPE.CONSTRUCTOR);
    return n;
  case '.':
  case '[':
    this.assert( this.scopeFlags & SCOPE.METH);
    return n;
  default:
    this.assert(false);
  }
};
