function if_state_geq(n, v) { return if_state(n, '>=', v); }
function if_state_lt(n, v) { return if_state(n, '<', v); }
function if_state_leq(n, v) { return if_state(n, '<=', v); }
function if_state_gt(n, v) { return if_state(n, '>', v); }
function if_state_eq(n, v) { return if_state(n, '===', v); }

function if_state(b, o, state) {
  return {
    type: 'IfStatement', 
    test: {
     type: 'BinaryExpression',
     right: { type: 'Literal', value: state },
     left: { type: 'Identifier', name: 'state' },
     operator: o, y: 0
    }, consequent: toBody(b), alternate: null, y: 0
  }; 
}

var TRUE = { type: 'Literal', value: true };

function do_while_nocond(n) {
  return {
    type: 'DoWhileStatement',
    test: TRUE, body: toBody(b), y: 0
  };
}

function while_nocond(n) {
  return {
    type: 'WhileStatement', y: 0,
    test: TRUE, body: toBody(b)
  };
}

function set_state(v) { 
  return {
    type: 'ExpressionStatement',
    expression: {
     type: 'AssignmentExpression',
     right: { type: 'Literal', value: v },
     left: { type: 'Identifier', name: 'state' },
     operator: '=',
     y: 0
    }, y: 0
  };
}

function withErrorGuard(b, n) {
  var next = n.next();
  if (next)
    return [set_state(-next.min)].concat(b);

  return b;
}

function toIfTest(n) {
  var cond = n.partitions[0];
  var a = null, c = [set_state(n.owner.consequent.min)];

  if (n.owner.alternate)
    a = [set_state(n.owner.alternate.min)];
  else {
    var next = n.owner.next();
    a = [set_state(next?next.min:-1)];
  }
  return synth_if_node(cond,c,a,0,0);
}

function toLoopTest(n) {
  return synth_if_node(
     n.partitions[0], [set_state(n.next().min)], [{ type: 'BreakStatement', label: null }], 0, 0);
}
 
