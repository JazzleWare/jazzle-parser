
this.parseLet = function(context) {

// this function is only calld when we have a 'let' at the start of a statement,
// or else when we have a 'let' at the start of a for's init; so, CTX_FOR means "at the start of a for's init ",
// not 'in for'

  var startc = this.c0, startLoc = this.locBegin();
  var c = this.c, li = this.li, col = this.col, raw = this.ltraw;

  var letDecl = this.parseVariableDeclaration(context);

  if ( letDecl )
    return letDecl;

  if (this.tight && this.err('strict.let.is.id') )
    return this.errorHandlerOutput ;

  this.canBeStatement = false;
  this.pendingExprHead = {
     type: 'Identifier',
     name: 'let',
     start: startc,
     end: c,
     loc: { start: startLoc, end: { line: li, column: col }, raw: raw }
  };

  if (this.onToken_ !== null)
    this.onToken({type: 'Identifier', value: raw, start: startc, end: c, loc:this.pendingExpreHead.loc });

  return null ;
};

this.hasDeclarator = function() {

  switch (this.lttype) {
  case '[':
  case '{':
  case 'Identifier':
    return true;
  
  default:
    return false;

  }
};
