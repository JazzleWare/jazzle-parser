Emitter.prototype.indent = function() {
  this.indentLevel++;
};

Emitter.prototype.i = function() {
  this.indent();
  return this;
};

Emitter.prototype.l = function() {
  this.startLine();
  return this;
};

Emitter.prototype.emitHead =
function(n, prec, flags) {
  switch (n.type) {
  case 'ConditionalExpression':
  case 'UnaryExpression':
  case 'BinaryExpression':
  case 'LogicalExpression':
  case 'UpdateExpression':
  case 'ConditionalExpression':
  case 'AssignmentExpression':
  case 'ArrowFunctionExpression':
  case 'SequenceExpression':
  case 'SynthSequenceExpression':
    this.w('(').eA(n, PREC_NONE, EC_NONE).w(')');
    break;
  default:
    this.emitAny(n, prec, flags);
    break;
  }
};

Emitter.prototype.eH = function(n, prec, flags) {
  this.emitHead(n, prec, flags);
  return this;
};

Emitter.prototype.emitAny = function(n, prec, startStmt) {
  if (HAS.call(Emitters, n.type))
    return Emitters[n.type].call(this, n, prec, startStmt);
  this.err('unknow.node');
};

Emitter.prototype.eA = function(n, prec, startStmt) {
  this.emitAny(n, prec, startStmt);
  return this;
};

Emitter.prototype.emitNonSeq = function(n, prec, flags) {
  var paren =
    n.type === 'SequenceExpression' ||
    n.type === 'SynthSequenceExpression';
  if (paren) this.w('(');
  this.emitAny(n, prec, flags);
  if (paren) this.w(')');
};

Emitter.prototype.eN = function(n, prec, flags) {
  this.emitNonSeq(n, prec, flags);
  return this;
};

Emitter.prototype.write = function(rawStr) {
  if (this.lineStarted) {
    this.code += this.getOrCreateIndent(this.indentLevel);
    this.lineStarted = false;
  }
  this.code += rawStr;
};

Emitter.prototype.w = function(rawStr) {
  this.write(rawStr);
  return this;
};

Emitter.prototype.space = function() {
  if (this.lineStarted)
    this.err('useless.space');

  this.write(' ');
};

Emitter.prototype.s = function() {
  this.space();
  return this;
};

Emitter.prototype.writeMulti =
Emitter.prototype.wm = function() {
  var i = 0;
  while (i < arguments.length) {
    var str = arguments[i++];
    if (str === ' ')
      this.space();
    else
      this.write(str);
  }

  return this;
};

Emitter.prototype.unindent = function() {
  if (this.indentLevel <= 0)
    this.err('unindent.nowidth');

  this.indentLevel--;
};

Emitter.prototype.u = function() {
  this.unindent();
  return this;
};

Emitter.prototype.getOrCreateIndent = function(indentLen) {
  var cache = this.indentCache;
  if (indentLen >= cache.length) {
    if (indentLen !== cache.length)
      this.err('inceremental.indent');
    cache.push(cache[cache.length-1] + this.spaceString);
  }
  return cache[indentLen];
};

Emitter.prototype.startLine = function() {
  this.insertNL();
  this.lineStarted = true;
};

Emitter.prototype.insertNL = function() {
  this.code += '\n';
};

Emitter.prototype.noWrap = function() {
  this.noWrap_ = true;
  return this;
};
