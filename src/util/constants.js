var INTBITLEN = (function() { var i = 0;
  while ( 0 < (1 << (i++))) if (i >= 512) return 8;
  return i;
}());

var D_INTBITLEN = 0, M_INTBITLEN = INTBITLEN - 1;
while ( M_INTBITLEN >> (++D_INTBITLEN) );

module.exports.default = module.exports = {
  SCOPE: {
    BREAK:        1,
    CONTINUE:     this.BREAK << 1,
    FUNCTION:     this.CONTINUE << 1,
    METH:         this.FUNCTION << 1,
    YIELD:        this.METH << 1,
    CONSTRUCTOR:  this.YIELD << 1
  },

  CONTEXT: {
    FOR: 1, ELEM: 2, NONE: 0, NULLABE: 4, DEFAULT: 32
  },

  // INT BIT LEN
  INTBITLEN: INTBITLEN,
  D_INTBITLEN: D_INTBITLEN,
  M_INTBITLEN: M_INTBITLEN,

  // MISC
  PAREN: 'paren',

  ANY_ARG_LEN: -1,

  WHOLE_FUNCTION: 8,
  ARGLIST_AND_BODY_GEN: 1,
  ARGLIST_AND_BODY: 2,
  METH_FUNCTION: 4,
  CONSTRUCTOR_FUNCTION: 128,

  OBJ_MEM: !false,

  STRING_TYPE: typeof 'string'
};
