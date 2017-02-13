Emitters['MemberExpression'] = function(n, prec, flags) {
  var objParen = false;
  if (!isMemHead(n.object)) {
    objParen = true;
    flags = EC_NONE;
  }

  if (objParen) this.w('(');
  this.eN(n.object);
  if (objParen) this.w(')');

  if (n.computed)
    this.w('[').eA(n.property, PREC_NONE, EC_NONE).w(']');
  else if (this.isReserved(n.property.name)) {
    this.w('[').emitStringLiteralWithRawValue("'"+n.property.name+"'");
    this.w(']');
  }
  else {
    this.w('.');
    this.emitIdentifierWithValue(n.property.name);
  }
};

function isMemHead(expr) {
  switch (expr.type) {

  case 'ConditionalExpression':
  case 'UnaryExpression':
  case 'BinaryExpression':
  case 'LogicalExpression':
  case 'UpdateExpression':
  case 'ConditionalExpression':
  case 'AssignmentExpression':
  case 'ArrowFunctionExpression':
    return false;
  default: return true;
  }
}
