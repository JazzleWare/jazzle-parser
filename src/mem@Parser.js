// TODO: the values for li, col, and c can be calculated
// by adding the value of raw.length to li0, col0, and c0, respectively,
// but this holds only in a limited use case where the
// value of the `raw` param is known to be either 'static', 'get', or 'set';
// but if this is going to be called for any value of raw containing surrogates, it may not work correctly.
function assembleID(c0, li0, col0, raw, val) {
  return { 
    type: 'Identifier', raw: raw,
    name: val, end: c0 + raw.length,
    start: c0, 
    loc: {
      start: { line: li0, column: col0 },
      end: { line: li0, column: col0 + raw.length }
    }
  }
}

this.parseMem = function(context, flags) {
  var c0 = 0, li0 = 0, col0 = 0, nmod = 0,
      nli0 = 0, nc0 = 0, ncol0 = 0, nraw = "", nval = "", latestFlag = 0;

  var asyncNewLine = false;
  if (this.lttype === 'Identifier') {
    LOOP:  
    // TODO: check version number when parsing get/set
    do {
      if (nmod === 0) {
        c0 = this.c0; li0 = this.li; col0 = this.col0;
      }
      switch (this.ltval) {
      case 'static':
        if (!(flags & MEM_CLASS)) break LOOP;
        if (flags & MEM_STATIC) break LOOP;
        if (flags & MEM_ASYNC) break LOOP;

        nc0 = this.c0; nli0 = this.li0;
        ncol0 = this.col0; nraw = this.ltraw;
        nval = this.ltval;

        flags |= latestFlag = MEM_STATIC;
        nmod++;
        this.next();
        break;

      case 'get':
      case 'set':
        if (flags & MEM_ACCESSOR) break LOOP;
        if (flags & MEM_ASYNC) break LOOP;

        nc0 = this.c0; nli0 = this.li0;
        ncol0 = this.col0; nraw = this.ltraw;
        nval = this.ltval;
        
        flags |= latestFlag = this.ltval === 'get' ? MEM_GET : MEM_SET;
        nmod++;
        this.next();
        break;

      case 'async':
        if (flags & MEM_ACCESSOR) break LOOP;
        if (flags & MEM_ASYNC) break LOOP;

        nc0 = this.c0; nli0 = this.li0;
        ncol0 = this.col0; nraw = this.ltraw;
        nval = this.ltval;

        flags |= latestFlag = MEM_ASYNC;
        nmod++;
        this.next();
        if (this.nl) {
          asyncNewLine = true;
          break;
        }

        break;

      default:
        break LOOP;

      }
    } while (this.lttype === 'Identifier');
  }
  
  if (this.lttype === 'op' && this.ltraw === '*') {
    if (!c0) { c0 = this.c-1; li0 = this.li; col0 = this.col-1; }

    flags |= latestFlag = MEM_GEN;
    nmod++;
    this.next();
  }

  var nmem = null;
  switch (this.lttype) {
  case 'Identifier':
    if (asyncNewLine)
      this.err('async.newline');

    if ((flags & MEM_CLASS)) {
      if (this.ltval === 'constructor') flags |= MEM_CONSTRUCTOR;
      if (this.ltval === 'prototype') flags |= MEM_PROTOTYPE;
    }
    else if (this.ltval === '__proto__')
      flags |= MEM_PROTO;

    nmem = this.memberID();
    break;
  case 'Literal':
    if (asyncNewLine)
      this.err('async.newline');

    if ((flags & MEM_CLASS)) {
      if (this.ltval === 'constructor') flags |= MEM_CONSTRUCTOR;
      if (this.ltval === 'prototype') flags |= MEM_PROTOTYPE;
    }
    else if (this.ltval === '__proto__')
      flags |= MEM_PROTO;

    nmem = this.numstr();
    break;
  case '[':
    if (asyncNewLine)
      this.err('async.newline');

    nmem = this.memberExpr();
    break;
  default:
    if (nmod && latestFlag !== MEM_GEN) {
      nmem = assembleID(nc0, nli0, ncol0, nraw, nval);
      flags &= ~latestFlag; // it's found out to be a name, not a modifier
      nmod--;
    }
  }

  if (nmem === null) {
    if (flags & MEM_GEN)
      this.err('mem.gen.has.no.name');
    return null;
  } 

  if (this.lttype === '(') {

    var mem = this.parseMeth(nmem, flags);
    if (c0 && c0 !== mem.start) {
      mem.start = c0;
      mem.loc.start = { line: li0, column: col0 };
    }
    return mem;
  }

  if (flags & MEM_CLASS)
    this.err('unexpected.lookahead');

  if (nmod)
    this.err('unexpected.lookahead');

  // TODO: it is not strictly needed -- this.parseObjElem itself can verify if the name passed to it is
  // a in fact a non-computed value equal to '__proto__'; but with the approach below, things might get tad
  // faster
  if (flags & MEM_PROTO)
    context |= CTX_HASPROTO;

  return this.parseObjElem(nmem, context|(flags & MEM_PROTO));
};
 
this.parseObjElem = function(name, context) {
  var hasProto = context & CTX_HASPROTO, firstProto = this.first__proto__;
  var val = null;
  context &= ~CTX_HASPROTO;

  switch (this.lttype) {
  case ':':
    if (hasProto && firstProto)
      this.err('obj.proto.has.dup');

    this.next();
    val = this.parseNonSeqExpr(PREC_WITH_NO_OP, context);

    if (context & CTX_PARPAT) {
      if (val.type === PAREN_NODE) {
        if ((context & CTX_PARAM) &&
           !(context & CTX_HAS_A_PARAM_ERR) &&
           this.pt === ERR_NONE_YET) {
          this.pt = ERR_PAREN_UNBINDABLE; this.pe = val;
        }
        if ((context & CTX_PAT) &&
           !(context & CTX_HAS_A_PARAM_ERR) &&
           this.at === ERR_NONE_YET) {
          this.at = ERR_PAREN_UNBINDABLE; this.pe = val;
        }
      }
    }

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
      this.err('obj.prop.assig.not.id');
    if (this.ltraw !== '=')
      this.err('obj.prop.assig.not.assigop');
    if (!(context & CTX_PAT))
      this.err('obj.prop.assig.not.allowed');

    val = this.parseAssignment(name, context);
    if (!(context & CTX_HAS_A_SIMPLE_ERR) &&
       this.st === ERR_NONE_YET) {
      this.st = ERR_SHORTHAND_UNASSIGNED; this.se = val;
    }
 
    break;

  default:
    if (name.type !== 'Identifier')
      this.err('obj.prop.assig.not.id');
    this.validateID(name.name);
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


