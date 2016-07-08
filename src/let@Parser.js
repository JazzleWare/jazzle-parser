
_class.parseLet = function(context) {

// this function is only calld when we have a 'let' at the start of an statement,
// or else when we have a 'let' at the start of a for's init; so, CONTEXT_FOR means "at the start of a for's init ",
// not 'in for'
 
  var startc = this.c0, startLoc = this.locBegin();
  var c = this.c, li = this.li, col = this.col;

  var letDecl = this.parseVariableDeclaration(context);

  if ( letDecl )
    return letDecl;

  _assert(!this.tight);

  this.canBeStatement = false;
  this.pendingExprHead = {
     type: 'Identifier',
     name: 'let',
     start: startc,
     end: c,
     loc: { start: startLoc, end: { line: li, column: col } }
  };

  return null ;
};


