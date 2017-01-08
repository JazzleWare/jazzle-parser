this.parseExpr = function (context) {
  var head = this.parseNonSeqExpr(PREC_WITH_NO_OP, context);
  var lastExpr = null;

  if ( this.lttype !== ',' )
    return head;

  // TODO: abide to the original context by using `context = context|(CTX_FOR|CTX_PARPAT)` rather than the
  // assignment below
  context = (context & CTX_FOR)|CTX_PARPAT;

  var e = [core(head)];
  do {
    this.next() ;
    lastExpr = this.parseNonSeqExpr(PREC_WITH_NO_OP, context);
    e.push(core(lastExpr));
  } while (this.lttype === ',' );

  return {
    type: 'SequenceExpression', expressions: e,
    start: head.start, end: lastExpr.end,
    loc: { start : head.loc.start, end : lastExpr.loc.end}/* ,y:-1*/
  };
};

this.parseCond = function(cond, context) {
  this.next();
  var seq =
    this.parseNonSeqExpr(PREC_WITH_NO_OP, CTX_NONE);

  if (!this.expectType_soft(':'))
    this.err('cond.colon',{extra:[cond,seq,context]});

  var alt =
    this.parseNonSeqExpr(PREC_WITH_NO_OP, context & CTX_FOR);

  return {
    type: 'ConditionalExpression', test: core(cond),
    start: cond.start, end: alt.end,
    loc: {
      start: cond.loc.start,
      end: alt.loc.end
    }, consequent: core(seq),
    alternate: core(alt) /* ,y:-1*/
  };
};

this.parseUnaryExpression = function(context) {
  var u = null,
      startLoc = null,  
      startc = 0,
      isVDT = this.isVDT;

  if (isVDT) {
    this.kw();
    this.isVDT = VDT_NONE;
    u = this.ltval;
    startLoc = this.locBegin();
    startc = this.c0;
  }
  else {
    u = this.ltraw;
    startLoc = this.locOn(1);
    startc = this.c - 1;
  }

  this.next();
  var arg = this.parseNonSeqExpr(PREC_U, context & CTX_FOR);

  if (this.tight &&
      isVDT === VDT_DELETE &&
      core(arg).type !== 'MemberExpression')
    this.err('delete.arg.not.a.mem',{tn:arg,extra:{c0:startc,loc0:startLoc,context:context}});

  if (isVDT === VDT_AWAIT) {
    var n = {
      type: 'AwaitExpression', argument: core(arg),
      start: startc, end: arg.end,
      loc: { start: startLoc, end: arg.loc.end }
    };
    this.suspys = n;
    return n;
  }
  
  return {
    type: 'UnaryExpression', operator: u,
    start: startc, end: arg.end,
    loc: {
      start: startLoc,
      end: arg.loc.end
    }, argument: core(arg),
    prefix: true
  };
};

this.parseUpdateExpression = function(arg, context) {
  var c = 0, loc = null, u = this.ltraw;
  if (arg === null) {
    c = this.c-2;
    loc = this.locOn(2);
    this.next() ;
    arg = this.parseExprHead(context & CTX_FOR);

    if (!this.ensureSimpAssig_soft(core(arg)))
      this.err('incdec.pre.not.simple.assig',{tn:core(arg)});

    return {
      type: 'UpdateExpression', operator: u,
      start: c, end: arg.end, argument: core(arg),
      loc: { start: loc, end: arg.loc.end },
      prefix: true
    };
  }

  if (!this.ensureSimpAssig_soft(core(arg)))
    this.err('incdec.post.not.simple.assig',{tn:core(arg)});

  c  = this.c;
  loc = {
    start: arg.loc.start,
    end: { line: this.li, column: this.col }
  };

  this.next() ;
  return {
    type: 'UpdateExpression', operator: u,
    start: arg.start, end: c,
    argument: core(arg), loc: loc,
    prefix: false
  };
};

this .parseO = function(context ) {
  switch ( this. lttype ) {
  case 'op': return true;
  case '--': return true;
  case '-': this.prec = PREC_ADD_MIN; return true;
  case '/':
    if ( this.src.charCodeAt(this.c) === CH_EQUALITY_SIGN ) {
      this.c++ ;
      this.prec = PREC_OP_ASSIG;
      this.ltraw = '/=';
      this.col++; 
    }
    else
      this.prec = PREC_MUL ; 

    return true;

  case 'Identifier':
    switch ( this. ltval ) {
    case 'in':
      this.kw();
      this.resvchk();
    case 'of':
      if (context & CTX_FOR) break ;
      this.prec = PREC_COMP ;
      this.ltraw = this.ltval;
      return true;

    case 'instanceof':
      this.resvchk();
      this.prec = PREC_COMP  ;
      this.ltraw = this.ltval ;
      return true;

    }
    break;

  case '?':
    this .prec = PREC_COND;
    return true;

  default:
    return false;

  }
};

this.parseNonSeqExpr = function (prec, context) {
  var head = this.parseExprHead(context);
  if ( head === null ) {
    switch ( this.lttype ) {
    case 'u':
    case '-':
      head = this.parseUnaryExpression(context);
      break;

    case '--':
       head = this.parseUpdateExpression(null, context);
       break;

    case 'yield':
      // make sure there is no other expression before it 
      if (prec !== PREC_WITH_NO_OP) 
        return this.err('yield.as.an.id');

      // everything that comes belongs to it 
      return this.parseYield(context); 
 
    default:
      if (!(context & CTX_NULLABLE) )
        return this.err('nexpr.null.head');
       
      return null;
    }
  }

  var op = this.parseO(context);
  var assig = op && isAssignment(this.prec);
  if (assig) {
    if (prec === PREC_WITH_NO_OP)
      head = this.parseAssignment(head, context);
    else
      this.err('assig.not.first');
  }

  if ((context & CTX_PAT) &&
     (context & CTX_NO_SIMPLE_ERR))
      this.currentExprIsSimple();
  
  if (!op || assig)
    return head;

  do {
    var currentPrec = this.prec;

    if (currentPrec === PREC_COND) {
      if (prec === PREC_WITH_NO_OP)
        head = this.parseCond(head, context);
      break;
    }

    if ( isMMorAA(currentPrec) ) {
      if (this.nl )
        break;
    
      head = this.parseUpdateExpression(head, context);
      continue;
    }
    
    if (prec === PREC_U && currentPrec === PREC_EX)
      this.err('unary.before.an.exponentiation');
    if (currentPrec < prec)
      break;
    if (currentPrec === prec && !isRassoc(prec))
      break;

    var o = this.ltraw;
    this.next();
    var right = this.parseNonSeqExpr(currentPrec, context & CTX_FOR);
    head = {
      type: !isBin(currentPrec) ? 'LogicalExpression' : 'BinaryExpression',
      operator: o,
      start: head.start,
      end: right.end,
      loc: {
        start: head.loc.start,
        end: right.loc.end
      },
      left: core(head),
      right: core(right)/* ,y:-1*/
    };

  } while (op = this.parseO(context));

  return head;
};
