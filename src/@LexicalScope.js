function LexicalScope(sParent, sType) {
  Scope.call(this, sParent, sType|ST_LEXICAL);

  this.synthName = "";
  this.childBindings = null;
  
  var surroundingCatch =
    sParent.isCatch() ?
      sParent :
      sParent.isLexical() ?                                sParent.surroundingCatch :
        null;
}

LexicalScope.prototype = createObj(Scope.prototype);
