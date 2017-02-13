this.parseProgram = function () {
  var startc = this.c, li = this.li, col = this.col;
  var endI = this.c , startLoc = null;
  var globalScope = null;

  // #if V
  globalScope = new Scope(null, ST_GLOBAL);
  // #end
 
  this.directive = !this.isScipt ? DIR_SCRIPT : DIR_MODULE; 
  this.clearAllStrictErrors();

  this.scope = new Scope(globalScope, ST_SCRIPT);
  this.scope.parser = this;
  this.next();
  this.scopeFlags = SCOPE_FLAG_IN_BLOCK;

  var list = this.blck(); 
        
  alwaysResolveInTheParentScope(this.scope);
  var n = {
    type: 'Program',
    body: list,
    start: 0,
    end: this.src.length,
    sourceType: !this.isScript ? "module" : "script" ,
    loc: {
      start: {line: li, column: col},
      end: {line: this.li, column: this.col}
    }
  };

  if (this.onToken_ !== null) {
    if (typeof this.onToken_ !== FUNCTION_TYPE)
      n.tokens = this.onToken_;
  }

  if (this.onComment_ !== null) {
    if (typeof this.onComment_ !== FUNCTION_TYPE)
      n.comments = this.onComment_;
  }

  if ( !this.expectType_soft ('eof') &&
        this.err('program.unfinished') )
    return this.errorHandlerOutput ;

  return n;
};

function alwaysResolveInTheParentScope(scope) {
  // #if V
  var decl = null, ref = null, name = "", refName = "";
  for ( refName in scope.unresolvedNames) {
    if (!HAS.call(scope.unresolvedNames, refName))
      continue;
    ref = scope.unresolvedNames[refName];
    if (!ref)
      continue;
    name = refName.substring(0, refName.length - 1) ;
    decl = new Decl(DECL_MODE_VAR, name, scope.parent, name);
    scope.parent.insertDecl0(true, name, decl);
    decl.refMode.updateExistingRefWith(name, scope);
  }
  // #end
}

