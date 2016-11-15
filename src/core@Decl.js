this.funcDecl = function() { return this.scope === this.scope.funcScope; };

this.isScopeObj = function() { 
   return this === this.scope.scopeObjVar;
};

this.needsScopeVar = function() {
   return ( this.type & DECL_MODE_LET ) &&
          this.scope.isLoop() &&
          this.refMode.indirect; 
};

this.syntheticUnlessInAFunc = function() {
  return this.type & DECL_MODE_LET;
};

