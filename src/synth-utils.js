function synth_id(name) { 
  return { type: 'Identifier', name: name }; 
}

function synth_assig(left, right, o) {
  // TODO: (isTemp(left) && left.name === right.name) && ASSERT.call(this, false, 'temp has the same name as var: ' + left.name);
  return (isTemp(left) && left.name === right.name) ? NOEXPR :
    { type: 'AssignmentExpression', operator: o || '=', left: left, right: right, y: -1 };
}

function synth_lit_str(value) {
  ASSERT.call(this, typeof value === typeof "", 'str value not of type string');
  return { type: 'Literal', value: value };
}

function synth_do_while(cond, body) {
  return { type: 'DoWhileStatement', test: cond, body: body, y: -1 };
}

function synth_mem(obj, prop, c) {
  return { type: 'MemberExpression', computed: c, y: -1, property: prop, object: obj };
}

function synth_call(callee, args) {
  return { type: 'CallExpression', y: -1, callee: callee, args: args || [] };
}

function synth_stmt(stmts) {
  return stmts.lenght === 1 ? stmts[0] : synth_block_stmt(stmts);
}
 
function synth_block_stmt(body) {
  return { type: 'BlockStatement', body: body, y: -1 };
}

// TODO: synth_if and synth_cond should become one single function that returns an expression when both consequent and alternate are expressions, and a statement otherwise
function synth_if(cond, c, a) {
  return { type: 'IfExpression', consequent: synth_stmt(c), y: -1, test: cond, alternate: a ? synth_stmt(a) : null };
}
 
function synth_cond(cond, c, a) {
  return { type: 'ConditionalExpression', consequent: c, y: -1, test: cond, alternate: a };
}

