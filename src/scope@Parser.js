Parser.prototype.declare = function(id) {
   ASSERT.call(this, this.declMode !== DM_NONE, 'Unknown declMode');
   if (this.declMode & (DM_LET|DM_CONST)) {
     if (id.name === 'let')
       this.err('lexical.name.is.let');
   }

   this.scope.declare(id.name, this.declMode).s(id);
};

Parser.prototype.enterScope = function(scope) {
  this.scope = scope;
};

Parser.prototype.exitScope = function() {
  var scope = this.scope;
  scope.finish();
  this.scope = this.scope.parent;
  return scope;
};

Parser.prototype.allow = function(allowedActions) {
  this.scope.allowed |= allowedActions;
};
