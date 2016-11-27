function Scope(parent, type) {
  this.type = type;

  if (!parent) 
    ASSERT.call(this.isFunc(), 'sub-scopes must have a parent');

  this.parent = parent;
  this.funcScope = 
     this.isFunc() ? this : this.parent.funcScope;

  // #if !V
  this.definedNames = {};
  // #end

  // #if V
  this.definedNames = this.parent ? createObj(this.parent.definedNames) : {};
  this.unresolvedNames = {};

  // serves the same purpose as the definedNames above, except that it only contains the names in the current scope;
  // iterating over the definedNames object means iterating over _all_ names available to the current scope;
  // this is the reason nameList exists -- to keep the track of the names local to this scope
  this.nameList = []; 

  this.wrappedDeclList = null;
  this.wrappedDeclNames = null;
  this.scopeObjVar = null;

  this.tempStack = this.isFunc() ? [] : null;

  if (this.isLexical() && !this.isLoop() && this.parent.isLoop())
    this.type |= SCOPE_TYPE_LEXICAL_LOOP;    

  this.catchVarIsSynth = false;
  this.catchVarName = ""; 

  this.globalLiquidNames = this.parent ? this.parent.globalLiquidNames : new LiquidNames();
  this.localLiquidNames = null;

  this.children = [];
  if (this.parent) this.parent.children.push(this);

  // used when name synthesizing starts
  this.referencedEmitNames = null; // <k, v>: (emitName, actualName) -- for the names referenced in the current scope
  // <k, v>: (emitName, actualName) -- for the name defined in the current scope; only functions are supposed to have one of these 
  this.definedEmitNames = {}; 

  // #end
}

Scope.createFunc = function(parent, decl) {
  var scope = new Scope(parent, decl ?
       SCOPE_TYPE_FUNCTION_DECLARATION :
       SCOPE_TYPE_FUNCTION_EXPRESSION );
  return scope;
};

Scope.createLexical = function(parent, loop) {
   return new Scope(parent, !loop ?
        SCOPE_TYPE_LEXICAL_SIMPLE :
        SCOPE_TYPE_LEXICAL_LOOP);
};
