this.parseMem = function(context) {
  var c0 = 0, li0 = 0, col0 = 0, nmod = 0,
      nli0 = 0, nc0 = 0, ncol0 = 0, nraw = "", nval = "";

  if (this.lttype === 'op' && this.ltval === '*') {
    c0 = this.c - 1; li0 = this.li; col0 = this.col - 1;
    context |= MEM_GEN;
  }
  else if (this.lttype === 'Identifier') {
    c0 = this.c0; li0 = this.li; col0 = this.col0;
    LOOP:  
    // TODO: check version number when parsing get/set
    do {
      switch (this.ltval) {
      case 'static':
        if (!(context & MEM_CLASS)) break LOOP;
        if (context & MEM_STATIC) break LOOP;
        nc0 = this.c0; nli0 = this.li0;i
        ncol0 = this.col0; nraw = this.ltraw;
        nval = this.ltval;
        nmod++; context |= MEM_STATIC; this.next();
        break;

      case 'get':
      case 'set':
        if (context & MEM_ACCESSOR) break LOOP;
        nc0 = this.c0; nli0 = this.li0;
        ncol0 = this.col0; nraw = this.ltraw;
        nval = this.ltval;
        context |= this.ltval === 'get' ? MEM_GET : MEM_SET;
        nmod++; this.next();
        break;

      default: break LOOP;
      }
    } while (this.lttype === 'Identifier');
  }
  
  var nmem = null;
  switch (this.lttype) {
  case 'Identifier':
    if ((context & MEM_CLASS)) {
      if (this.ltval === 'constructor') context |= MEM_CONSTRUCTOR;
      if (this.ltval === 'prototype') context |= MEM_PROTOTYPE;
    }
    else if (this.ltval === '__proto__')
      context |= MEM_PROTO;

    nmem = this.memberID();
    break;
  case 'Literal':
    if ((context & MEM_CLASS)) {
      if (this.ltval === 'constructor') context |= MEM_CONSTRUCTOR;
      if (this.ltval === 'prototype') context |= MEM_PROTOTYPE;
    }
    else if (this.ltval === '__proto__')
      context |= MEM_PROTO;

    nmem = this.parseLiteral();
    break;
  case '[':
    nmem = this.memberExpr();
    break;
  default:
    if (nmod) {
      nmem = this.assembleID(nc0, nli0, ncol0, nraw, nval);
      nmod--;
    }
  }

  if (nmem === null) {
    if (context & MEM_GEN)
      this.err('mem.gen.has.no.name');
    return null;
  } 

  if (this.lttype === '(') {
    var mem = this.parseMeth(nmem, context);
    if (c0) {
      mem.start = c0;
      mem.loc.start = { line: li0, column: col0 };
    }
    return mem;
  }

  if (context & MEM_CLASS)
    this.err('unexpected.lookahead');

  if (nmod)
    this.err('unexpected.lookahead');

  return this.parseObjElem(nmem, context);
};
 
this.parseObjElem = function(name, context) {
  var hasProto = context & MEM_PROTO, firstProto = this.first__proto__;
  var val = null;

  this.firstUnassignable = this.firstParen = null;
  switch (this.lttype) {
  case ':':
    if (hasProto && firstProto)
      this.err('obj.proto.has.dup');
    this.next();
    val = this.parseNonSeqExpr(PREC_WITH_NO_OP, context);
    if (!(context & CONTEXT_ELEM))
      this.err('obj.prop.assig.not.allowed', name, context);
    val = {
      type: 'Property', start: name.start,
      key: core(name), end: val.end,
      kind: 'init',
      loc: { start: name.loc.start, end: val.loc.end },
      computed: name.type === PAREN,
      method: false, shorthand: false, value: core(val)/* ,y:-1*/
    };
    if (hasProto)
      this.first__proto__ = val;
    return val;
 
  case 'op':
    if (name.type !== 'Identifier')
      this.err('obj.prop.assig.not.id', name, context);
    if (this.ltraw !== '=')
      this.err('obj.prop.assig.not.assigop', name, context);
    if (!(context & CONTEXT_ELEM))
      this.err('obj.prop.assig.not.allowed', name, context);
    val = this.parseAssig(name);
    this.unsatisfiedAssignment = val;
    break;

  default:
    if (name.type !== 'Identifier')
      this.err('obj.prop.assig.not.id', name, context);
    val = name;
    break;
  }
  
  return {
    type: 'Property', key: name,
    start: val.start, end: val.end,
    loc: val.loc, kind: 'init',
    shorthand: true, method: false,
    value: val, computed: false/* ,y:-1*/
  };
};


