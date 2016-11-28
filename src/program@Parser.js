this.parseProgram = function () {
  var startc = this.c, li = this.li, col = this.col;
  var endI = this.c , startLoc = null;
  var globalScope = null;

  // #if V
  globalScope = new Scope(null, SCOPE_TYPE_GLOBAL);
  //#end
 
  this.scope = new ParserScope(this, globalScope, SCOPE_TYPE_SCRIPT);
  this.next();
  this.scopeFlags = SCOPE_BLOCK;

  this.directive = DIRECTIVE_FUNC; 
  var list = this.blck(); 
 
  var endLoc = null;
  if (list.length) {
    var firstStatement = list[0];
    startc = firstStatement.start;
    startLoc = firstStatement.loc.start;    

    var lastStatement = list[ list.length - 1 ];
    endI = lastStatement.end;
    endLoc = lastStatement.loc.end;
  }
  else {
    endLoc = startLoc = { line: 0, column: 0 };
  }
        
  alwaysResolveInTheParentScope(this.scope);
  var n = { type: 'Program', body: list, start: startc, end: endI, sourceType: !this.isScript ? "module" : "script" ,
           loc: { start: startLoc, end: endLoc } };

  if ( !this.expectType_soft ('eof') &&
        this.err('program.unfinished',n) )
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

