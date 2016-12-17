this.parseObjectExpression = function(context) {
  var startc = this.c0,
      startLoc = this.locBegin(),
      elem = null,
      list = [],
      first__proto__ = null,
      elemContext = CTX_NONE,
      pt = ERR_NONE_YET, pe = null, po = null,
      at = ERR_NONE_YET, ae = null, ao = null,
      st = ERR_NONE_YET, se = null, so = null,
      n = null;

  if (context & CTX_PAT) {
    elemContext |= context & CTX_PARPAT;
    elemContext |= context & CONTEXT_PARAM_OR_PATTERN_ERR;
  }
  else 
    elemContext |= CTX_PAT|CTX_NO_SIMPLE_ERR;

  if (context & CTX_PARPAT) {
    if ((context & CTX_PARAM) &&
       !(context & CTX_HAS_A_PARAM_ERR)) {
      this.pt = ERR_NONE_YET; this.pe = this.po = null;
    }
    if ((context & CTX_PAT) &&
       !(context & CTX_HAS_AN_ASSIG_ERR)) {
      this.at = ERR_NONE_YET; this.ae = this.ao = null;
    }
    if (!(context & CTX_HAS_A_SIMPLE_ERR)) {
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
    if (!(context & CTX_PARPAT))
      continue;

    if ((context & CTX_PARAM) &&
       !(context & CTX_HAS_A_PARAM_ERR) &&
       this.pt !== ERR_NONE_YET) {
      pt = this.pt; pe = po = elem;
    }
    if ((context & CTX_PAT) &&
       !(context & CTX_HAS_AN_ASSIG_ERR) &&
       this.at !== ERR_NONE_YET) {
      at = this.at; ae = ao = elem;
    }
    if (!(context & CTX_HAS_A_SIMPLE_ERR) &&
       this.st !== ERR_NONE_YET) {
      st = this.st; se = so = elem;
    }
  } while (this.lttype === ',');

  if (context & CTX_PARPAT) {
    if ((context & CTX_PARAM) && pt !== ERR_NONE_YET) {
      this.pt = pt; this.pe = pe; this.po = po;
    }
    if ((context & CTX_PAT) && at !== ERR_NONE_YET) {
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

