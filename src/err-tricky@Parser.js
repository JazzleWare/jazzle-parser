this.currentExprIsParams = function() {
  this.st = this.pt = this.at = this.st = ERR_NONE_YET;
};

this.currentExprIsAssig = function() {
  this.st = this.pt = this.at = ERR_NONE_YET;
};

this.currentExprIsSimple = function() {
  this.pt = this.at = ERR_NONE_YET;
  if (this.st !== ERR_NONE_YET) {
    var st = this.st;
    var se = this.se;
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
tm[ERR_NON_TAIL_EXPR] = 'seq.non.tail.expr';
// TODO: trickyContainer
this.throwTricky = function(source, trickyType, trickyCore) {
  if (!HAS.call(tm, trickyType))
    throw new Error("Unknown error value: "+trickyType);
  
  this.err(tm[trickyType], {tn:trickyCore, extra:{source:source}});
}; 

this.adjustErrors = function() { 
  if (this.st === ERR_ARGUMENTS_OR_EVAL_ASSIGNED)
    this.st = ERR_ARGUMENTS_OR_EVAL_DEFAULT;
  else
    this.st = ERR_NONE_YET;
};

