this.funcDecl = function() { return this.scope === this.scope.funcScope; };

this.needsScopeVar = function() {
   return this.type === LET &&
          this.scope.isLoop() &&
          this.refMode.indirect; 
};

this.rename = function() {
   var synthName = this.scope.newSynthName(this.name);
   var funcScope = this.scope.funcScope;
   funcScope.insertDecl0(false, this.synthName, null);
   
   this.synthName = synthName;
   funcScope.insertDecl0(false, this.synthName, this);
};

this.isScopeObj = function() { 
   return this === this.scope.scopeObjVar;
};

