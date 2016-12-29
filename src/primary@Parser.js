this.parseExprHead = function (context) {
  var head = null, inner = null, elem = null;

  if (this.pendingExprHead) {
    head = this.pendingExprHead;
    this.pendingExprHead = null;
  }
  else
    switch (this.lttype)  {
    case 'Identifier':
      if (head = this.parseIdStatementOrId(context))
        break;

      return null;

    case '[' :
      head = this.parseArrayExpression(context);
      break;

    case '(' :
      head = this.parseParen(context);
      break;

    case '{' :
      head = this.parseObjectExpression(context) ;
      break;

    case '/' :
      head = this.parseRegExpLiteral() ;
      break;

    case '`' :
        head = this.parseTemplateLiteral() ;
        break;

    case 'Literal':
      head = this.numstr();
      break;

    case '-':
      this.prec = PREC_U;
      return null;

    default:
      return null;
   
    }
    
  // #if V
  if (head.type === 'Identifier')
    this.scope.reference(head.name);
  // #end

  switch (this.lttype) {
  case '.':
  case '[':
  case '(':
  case '`':
    this.currentExprIsSimple();
  }

  inner = core( head ) ;

  LOOP:
  while ( true ) {
    switch (this.lttype ) {
    case '.':
      this.next();
      if (this.lttype !== 'Identifier')
        this.err('mem.name.not.id');

      elem  = this.memberID();
      if (elem === null)
        this.err('mem.id.is.null');

      head = { 
        type: 'MemberExpression', property: elem,
        start: head.start, end: elem.end,
        loc: {
          start: head.loc.start,
          end: elem.loc.end 
        }, object: inner,
        computed: false /* ,y:-1*/
      };

      inner = head ;
      continue;

    case '[':
      this.next() ;
      elem = this.parseExpr(PREC_WITH_NO_OP,CTX_NONE);
      head = {
        type: 'MemberExpression', property: core(elem),
        start: head.start, end: this.c,
        loc : {
          start: head.loc.start,
          end: this.loc()
        }, object: inner,
        computed: true /* ,y:-1*/
      };
      inner  = head ;
      if (!this.expectType_soft (']'))
        this.err('mem.unfinished');
      continue;

    case '(':
      elem = this.parseArgList();
      head = {
        type: 'CallExpression', callee: inner,
        start: head.start, end: this.c, arguments: elem,
        loc: {
          start: head.loc.start,
          end: this.loc()
        } /* ,y:-1*/
      };

      if (!this.expectType_soft (')'))
        this.err('call.args.is.unfinished');

      inner = head  ;
      continue;

    case '`' :
      elem = this. parseTemplateLiteral();
      head = {
        type : 'TaggedTemplateExpression', quasi : elem,
        start: head.start, end: elem.end,
        loc : {
          start: head.loc.start,
          end: elem.loc.end
        }, tag : inner/* ,y:-1*/
      };
      inner = head;
      continue ;

    default: break LOOP;
    }

  }

  return head ;
};

this.parseMeta = function(startc,end,startLoc,endLoc,new_raw ) {
  if (this.ltval !== 'target')
    this.err('meta.new.has.unknown.prop');
  
  if (!(this.scopeFlags & SCOPE_FLAG_FN))
    this.err('meta.new.not.in.function');

  var prop = this.id();

  return {
    type: 'MetaProperty',
    meta: {
      type: 'Identifier', name : 'new',
      start: startc, end: end,
      loc: { start : startLoc, end: endLoc }, raw: new_raw  
    },
    start : startc,
    property: prop, end: prop.end,
    loc : { start: startLoc, end: prop.loc.end }
  };
};

this.numstr = function () {
  var n = {
    type: 'Literal', value: this.ltval,
    start: this.c0, end: this.c,
    loc: { start: this.locBegin(), end: this.loc() },
    raw: this.ltraw
  };
  this.next();
  return n;
};

this.parseTrue = function() {
  var n = {
    type: 'Literal', value: true,
    start: this.c0, end: this.c,
    loc: { start: this.locBegin(), end: this.loc() }, raw: this.ltraw
  };
  this.next();
  return n;
};

this.parseNull = function() {
  var n = {
    type: 'Literal', value: null,
    start: this.c0, end: this.c,
    loc: { start: this.locBegin(), end: this.loc() }, raw: this.ltraw
  };
  this.next();
  return n;
};

this.parseFalse = function() {
  var n = {
    type: 'Literal', value: false,
    start: this.c0, end: this.c,
    loc: { start: this.locBegin(), end: this.loc() }, raw: this.ltraw
  };
  this.next();
  return n;
};

this.id = function() {
  var id = {
    type: 'Identifier', name: this.ltval,
    start: this.c0, end: this.c,
    loc: { start: this.locBegin(), end: this.loc() }, raw: this.ltraw
  };
  this.next() ;
  return id;
};

this.parseThis = function() {
  var n = {
    type : 'ThisExpression',
    loc: { start: this.locBegin(), end: this.loc() },
    start: this.c0,
    end : this.c
  };
  this.next() ;

  return n;
};

this.parseArgList = function () {
  var parenAsync = this.parenAsync, elem = null, list = [];

  do { 
    this.next();
    elem = this.parseNonSeqExpr(PREC_WITH_NO_OP,CTX_NULLABLE|CTX_PAT|CTX_NO_SIMPLE_ERR); 
    if (elem)
      list.push(core(elem));
    else if (this.lttype === '...')
      list.push(this.parseSpreadElement(CTX_NONE));
    else {
      if (list.length !== 0) {
        if (this.v < 7)
          this.err('arg.non.tail');
      }
      break;
    }
  } while ( this.lttype === ',' );

  if (parenAsync !== null)
    this.parenAsync = parenAsync;

  return list ;
};
