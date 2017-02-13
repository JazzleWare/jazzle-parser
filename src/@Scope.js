function Scope(parent, type) {
  this.type = type;

  if (!parent) 
    ASSERT.call(this.isConcrete(), 'sub-scopes must have a parent');

  this.parent = parent;
  this.funcScope = 
     (this.isConcrete() || this.isGlobal()) ? this : this.parent.funcScope;

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

  this.tempStack = this.isConcrete() ? [] : null;

  if (this.isLexical() && !this.isLoop() && this.parent.isLoop())
    this.type |= ST_LOOP;    

  this.children = [];
  if (this.parent) this.parent.children.push(this);

  // TODO: replace both with something like 'cachedEmitNames', along with some associated methods like 'cacheEmitNames'
  //
  // used when name synthesizing starts
  this.referencedEmitNames = null; // <k, v>: (emitName, actualName) -- for the names referenced in the current scope
  // <k, v>: (emitName, actualName) -- for the name defined in the current scope; only functions are supposed to have one of these 
  this.definedEmitNames = {}; 

  // #end

  this.idNames = {};
  this.isInComplexArgs = false;
  this.strict = this.parent ? this.parent.strict : false;
  this.synth = false;
  
  // TODO: is it really needed? because all it will do is to delegate errors
  this.parser = null;
  if (this.parent && this.isConcrete())
    this.parser = this.parent.parser;
}

Scope.createFunc = function(parent, decl) {
  var scope = new Scope(parent, decl ?
       ST_FN_STMT :
       ST_FN_EXPR );
  return scope;
};

Scope.createLexical = function(parent, loop) {
   return new Scope(parent, !loop ?
        ST_LEXICAL :
        ST_LEXICAL|ST_LOOP);
};
