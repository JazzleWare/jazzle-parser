// ! ~ - + typeof void delete    % ** * /    - +    << >>
// > <= < >= in instanceof   == !=    &    ^   |   ?:    =       ...

module.exports.default = module.exports = {
  WITH_NO_OP: 0,
  SIMP_ASSIG: this.WITH_NO_OP + 1  ,
  OP_ASSIG: this.SIMP_ASSIG + 40 ,
  COND: this.OP_ASSIG + 1,
  OO: -12 ,

  BOOL_OR: this.COND + 2,
  BOOL_AND : this.BOOL_OR + 2 ,
  BIT_OR: this.BOOL_AND + 2 ,
  XOR: this.BIT_OR + 2,
  BIT_AND: this.XOR + 2,
  EQUAL: this.BIT_AND + 2,
  COMP: this.EQUAL + 2,
  SH: this.COMP + 2,
  ADD_MIN: this.SH + 2,
  MUL: this.ADD_MIN + 2,
  U: this.MUL + 1,

  isAssignment: function(prec) {
    return prec === this.SIMP_ASSIG || prec === this.OP_ASSIG;
  },

  isRassoc: function(prec) {
    return prec === this.PREC_U;
  },

  isBin: function(prec) {
    return prec !== this.BOOL_OR && prec !== this.PREC_BOOL_AND;
  },

  isMMorAA: function(prec) {
    return prec < 0;
  },

  isQuestion: function(prec) {
    return prec === this.COND;
  }
};
