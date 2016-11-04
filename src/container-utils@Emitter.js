this.if_state_geq = function(v) { return this.if_state('>=', v); };
this.if_state_lt  = function(v) { return this.if_state('<', v); };
this.if_state_leq = function(v) { return this.if_state('<=', v); };
this.if_state_gt  = function(v) { return this.if_state('>', v); };
this.if_state_eq  = function(v) { return this.if_state('===', v); };

this.if_state = function(o, state) {
  this.block_stack.push(IF_BLOCK);
  this.write('if (state '+o+' '+state+') {');
  this.indent(); 
};

this.do_while_nocond = function(n) {
  this.block_stack.push(DO_BLOCK);
  this.write('do {');
  this.indent();
};

this.while_nocond = function(n) {
   this.block_stack.push(WHILE_BLOCK);
   this.write('while (true) {');
   this.indent();
};

this.set_state = function(v) { 
  this.write('state');
  this.write('=');
  this.write(''+v);
  this.write(';');
};

this.withErrorGuard = function(b, n) {
  var next = n.next();
  if (next)
    this.set_state(-next.min);
};

this.end_block = function() {
  ASSERT.call(this, this.block_stack.length>0);
  this.unindent();
  this.newlineIndent(); 
  this.write('}');
  if (this.block_stack.pop()===DO_BLOCK)
    this.write(' while (true);');
};
