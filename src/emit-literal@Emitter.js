Emitters['Literal'] =
Emitter.prototype.emitLiteral = function(n, prec, flags) {
  switch (n.value) {
  case true: return this.write('true');
  case false: return this.write('false');
  case null: return this.write('null');
  default:
    switch (typeof n.value) {
    case NUMBER_TYPE:
      return this.emitNumberLiteralWithValue(n.value);
    case STRING_TYPE:
      return this.emitStringLiteralWithRawValue(n.raw);
    }
    ASSERT.call(this, false,
      'Unknown value for literal: ' + (typeof n.value));
  }
};

Emitter.prototype.emitNumberLiteralWithValue =
function(nv) {
  this.write(""+nv);
};

Emitter.prototype.emitStringLiteralWithRawValue =
function(svRaw) {
  this.write(svRaw);
};
