this.parseVariableDeclaration = function(context) {
  if (!this.canBeStatement)
    this.err('not.stmt');

  this.canBeStatement = false;

  var startc = this.c0,
      startLoc = this.locBegin(),
      kind = this.ltval,
      elem = null;

  if (this.unsatisfiedLabel) {
    if (kind === 'var')
      this.fixupLabels(false);
    else
      this.err('decl.label');
  }

  this.next();
  this.declMode = kind === 'var' ? 
    DECL_MODE_VAR : DECL_MODE_LET;
  
  if (kind === 'let' &&
      this.lttype === 'Identifier' &&
      this.ltval === 'in') {
    return null;
  }

  elem = this.parseVariableDeclarator(context);
  if (elem === null) {
    if (kind !== 'let') 
      this.err('var.has.no.declarators');

    return null; 
  }

  var isConst = kind === 'const';
  // TODO: if there is a context flag signifying that an init must be present,
  // this is no longer needed
  if (isConst && !elem.init && !this.missingInit) {
    if (!(context & CTX_FOR))
      this.err('const.has.no.init');
    else this.missingInit = true;
  }

  var list = null;
  if (this.missingInit) {
    if (context & CTX_FOR)
      list = [elem];
    else this.err('var.must.have.init');
  }
  else {
    list = [elem];
    while (this.lttype === ',') {
      this.next();     
      elem = this.parseVariableDeclarator(context);
      if (!elem)
        this.err('var.has.an.empty.declarator');
   
      if (this.missingInit || (isConst && !elem.init))
        this.err('var.init.is.missing');
   
      list.push(elem);
    }
  }

  var lastItem = list[list.length-1];
  var endI = 0, endLoc = null;

  if (!(context & CTX_FOR)) {
    endI = this.semiI() || lastItem.end;
    endLoc = this.semiLoc_soft();
    if (!endLoc) {
      if (this.nl)
        endLoc =  lastItem.loc.end; 
      else  
        this.err('no.semi');
    }
  }
  else {
    endI = lastItem.end;
    endLoc = lastItem.loc.end;
  }

  this.foundStatement = true ;

  return {
    declarations: list,
    type: 'VariableDeclaration',
    start: startc,
    end: endI,
    loc: { start: startLoc, end: endLoc },
    kind: kind /* ,y:-1*/
  };
};

this.parseVariableDeclarator = function(context) {
  var head = this.parsePattern(), init = null;
  if (!head)
    return null;

  if (this.lttype === 'op') {
    if (this.ltraw === '=')  {
       this.next();
       init = this.parseNonSeqExpr(PREC_WITH_NO_OP, context);
    }
    else 
      this.err('var.decl.not.=');
  }
  else if (head.type !== 'Identifier') { // our pattern is an arr or an obj?
    if (!( context & CTX_FOR))  // bail out in case it is not a 'for' loop's init
      this.err('var.decl.neither.of.in');

    this.missingInit = true;
  }

  var initOrHead = init || head;
  return {
    type: 'VariableDeclarator', id: head,
    start: head.start, end: initOrHead.end,
    loc: {
      start: head.loc.start,
      end: initOrHead.loc.end 
    }, init: init && core(init)/* ,y:-1*/
  };
};

