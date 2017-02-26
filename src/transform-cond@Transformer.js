transform['ConditionalExpression'] = function(n, list, isVal) {
  n.test = this.transform(n.test, list, true);
  if (this.y(n.consequent) || this.y(n.alternate))
    return this.transformConditionalExpressionWithYield(n, list, isVal);
  n.consequent = this.tr(n.consequent, list, isVal);
  n.alternate = this.tr(n.alternate, list, isVal);
  return n;
};

this.transformConditionalExpressionWithYield = function(n, list, isVal) {
  var ifBody = [], elseBody = [];
      t = null;
  n.consequent = this.tr(n.consequent, ifBody, isVal);
  if (isVal) {
    t = this.save(n.consequent, ifBody);
    this.rl(t);
  }
  n.alternate = this.tr(n.alternate, elseBody, isVal);
  if (isVal) {
    t = this.save(n.alternate, elseBody);
    this.rl(t);
  }
  push_checked(synth_if(n.test, ifBody, elseBody), list);
  return isVal ? t : NOEXPR;
};

