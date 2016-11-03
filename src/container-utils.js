function if_state_geq(n, v) { return if_state.call(n, '>=', v); }
function if_state_lt(n, v) { return if_state.call(n, '<', v); }
function if_state_leq(n, v) { return if_state.call(n, '<=', v); }
function if_state_gt(n, v) { return if_state.call(n, '>', v); }
function if_state_eq(n, v) { return if_state.call(n, '===', v); }
function if_state(o, state) {
  return {
    type: 'IfStatement', 
    test: {
     type: 'BinaryExpression',
     right: { type: 'Literal', value: state },
     left: { type: 'Identifier', name: 'state' },
     operator: o, y: 0
    }, consequent: toBody(this.partitions), alternate: null, y: 0
  }; 
}

var TRUE = { type: 'Literal', value: true };

function do_while_nocond(n) {
  return {
    type: 'DoWhileStatement',
    test: TRUE, body: toBody(n.partitions), y: 0
  };
}

function while_nocond(n) {
  return {
    type: 'WhileStatement', y: 0,
    test: TRUE, body: toBody(n.partitions)
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
