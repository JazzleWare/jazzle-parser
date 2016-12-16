this.parseObjectExpression = function(context) {
  var startc = this.c0,
      startLoc = this.locBegin(),
      elem = null,
      list = [],
      first__proto__ = null,
      elemContext = CONTEXT_NONE,
      pt = ERR_NONE_YET, pe = null, po = null,
      at = ERR_NONE_YET, ae = null, ao = null,
      st = ERR_NONE_YET, se = null, so = null,
      n = null;

  elemContext |= context & CONTEXT_PARAM_OR_PATTERN;
  elemContext |= context & CONTEXT_PARAM_OR_PATTERN_ERR;

  if (context & CONTEXT_PARAM_OR_PATTERN) {
    if ((context & CONTEXT_CAN_BE_PARAM) &&
       !(context & CONTEXT_HAS_AN_ERR_PARAM)) {
      this.pt = ERR_NONE_YET; this.pe = this.po = null;
    }
    if ((context & CONTEXT_CAN_BE_PATTERN) &&
       !(context & CONTEXT_HAS_AN_ERR_ASSIG)) {
      this.at = ERR_NONE_YET; this.ae = this.ao = null;
    }
    if (!(context & CONTEXT_HAS_AN_ERR_SIMPLE)) {
      this.st = ERR_NONE_YET; this.se = this.so = null;
    }
  }
  
  do {
    this.next();
    this.first__proto__ = first__proto__;
    elem = this.parseMem(elemContext, MEM_OBJ);

    if (elem === null)
      break;

    if (!first__proto__ && this.first__proto__)
      first__proto__ = this.first__proto__;

    list.push(elem);
    if (!(context & CONTEXT_PARAM_OR_PATTERN))
      continue;

    if ((context & CONTEXT_CAN_BE_PARAM) &&
       !(context & CONTEXT_HAS_AN_ERR_PARAM) &&
       this.pt !== ERR_NONE_YET) {
      pt = this.pt; pe = po = elem;
    }
    if ((context & CONTEXT_CAN_BE_PATTERN) &&
       !(context & CONTEXT_HAS_AN_ERR_ASSIG) &&
       this.at !== ERR_NONE_YET) {
      at = this.at; ae = ao = elem;
    }
    if (!(context & CONTEXT_HAS_AN_ERR_SIMPLE) &&
       this.st !== ERR_NONE_YET) {
      st = this.st; se = so = elem;
    }
  } while (this.lttype === ',');

  if (context & CONTEXT_PARAM_OR_PATTERN) {
    if ((context & CONTEXT_CAN_BE_PARAM) && pt !== ERR_NONE_YET) {
      this.pt = pt; this.pe = pe; this.po = po;
    }
    if ((context & CONTEXT_CAN_BE_PATTERN) && at !== ERR_NONE_YET) {
      this.at = at; this.ae = ae; this.ao = ao;
    }
    if (st !== ERR_NONE_YET) {
      this.st = st; this.se = se; this.so = so;
    }
  }

  n = {
    properties: list,
    type: 'ObjectExpression',
    start: startc,
    end: this.c,
    loc: { start: startLoc, end: this.loc() }/* ,y:-1*/
  };

  if (!this.expectType_soft('}'))
    this.err('obj.unfinished',{tn:n});

  return n;
};

