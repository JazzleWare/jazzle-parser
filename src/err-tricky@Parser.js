this.flushParenFromAnyErrors = function() {
  if (this.pt !== ERR_NONE_YET) {
    var pt = this.pt; this.pt = ERR_NONE_YET;
    var pe = this.pe; this.pe = null;
    this.po = null;
    this.throwTricky('p', pt, pe);
  }
};

this.flushAssigFromAnyErrors = function() {
  if (this.at !== ERR_NONE_YET) {
    var at = this.at; this.at = ERR_NONE_YET;
    var ae = this.ae; this.ae = null;
    this.ao = null;
    this.throwTricky('a', at, ae);
  }
};

this.flushSimpleFromAnyErrors = function() {
  if (this.st !== ERR_NONE_YET) {
    var st = this.st; this.st = NONE_YET;
    var se = this.se; this.se = null;
    this.so = null;
    this.throwTricky('s', st, se);
  }
};

// tricky map
var tm = {};

tm[ERR_PAREN_UNBINDABLE] = 'paren.unbindable';
tm[ERR_SHORTHAND_UNASSIGNED] = 'shorthand.unassigned';
tm[ERR_NON_TAIL_REST] = 'non.tail.rest';
tm[ERR_ARGUMENTS_OR_EVAL_ASSIGNED] = 'assig.to.arguments.or.eval';
tm[ERR_YIELD_OR_SUPER] = 'param.has.yield.or.super';
tm[ERR_UNEXPECTED_REST] = 'unexpected.rest';
tm[ERR_EMPTY_LIST_MISSING_ARROW] = 'arrow.missing.after.empty.list';

// TODO: trickyContainer
this.throwTricky = function(source, trickyType, trickyCore) {
  if (!HAS.call(tm, trickType))
    throw new Error("Unknown error value: "+trickyType);
  
  this.err(tm[trickyType], {tn:trickyCore, extra:{source:source}});
}; 
