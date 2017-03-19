Emitters['SyntheticAssignment'] =
Emitters['AssignmentExpression'] =
Emitter.prototype.emitAssig = function(n, prec, flags) {
  this.emitAssigLeft(n.left, flags);
  this.wm(' ',n.operator,' ');
  this.emitAssigRight(n.right);
};

Emitter.prototype.emitAssigLeft = function(n, flags) {
  return this.emitHead(n, PREC_NONE, flags);
};

Emitter.prototype.emitAssigRight = function(n) {
  this.eN(n, PREC_NONE, EC_NONE);
};
