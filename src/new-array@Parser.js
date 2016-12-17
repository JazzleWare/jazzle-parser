this.parseArrayExpression = function(context) {

  var startc = this.c - 1,
      startLoc = this.locOn(1);

  this.next();

  var elem = null,
      list = [];
  var elemContext = CTX_NULLABLE;

  if (context & CTX_PAT) {
    elemContext |= (context & CTX_PARPAT);
    elemContext |= (context & CONTEXT_PARAM_OR_PATTERN_ERR);
  }
  else
    elemContext |= CTX_PAT|CTX_NO_SIMPLE_ERR;

  var pt = ERR_NONE_YET, pe = null, po = null;
  var at = ERR_NONE_YET, ae = null, ao = null;
  var st = ERR_NONE_YET, se = null, so = null;

  if (context & CTX_PARPAT) {
    if ((context & CONTEXT_PARAM) &&
       !(context & CTX_HAS_A_PARAM_ERR)) {
      this.pt = ERR_NONE_YET; this.pe = this.po = null;
    }

    if ((context & CONTEXT_PATTERN) &&
       !(context & CTX_HAS_AN_ASSIG_ERR)) {
      this.at = ERR_NONE_YET; this.ae = this.ao = null;
    }

    if (!(context & CTX_HAS_A_SIMPLE_ERR)) {
      this.st = ERR_NONE_YET; this.se = this.so = null;
    }
  }

  var hasRest = false, hasNonTailRest = false;

  while (true) {
    elem = this.parseNonSeqExpr(PREC_WITH_NO_OP, elemContext);
    if (elem === null && this.lttype === '...') {
      elem = this.parseSpreadElement(elemContext);
      hasRest = true;
    }
    if (this.lttype === ',') {
      if (hasRest)
        hasNonTailRest = true; 
      list.push(core(elem));
      this.next();
    }
    else if (elem) list.push(core(elem));
    else break;
 
    if (elem &&
       (elemContext & CTX_PARPAT)) {
      var elemCore = hasRest ? elem.argument : elem;
      // TODO: [...(a),] = 12
      var t = ERR_NONE_YET;
      if (elemCore.type === PAREN_TYPE)
        t = ERR_PAREN_UNBINDABLE;
      else if (hasNonTailRest)
        t = ERR_NON_TAIL_REST;

      if ((elemContext & CTX_PARAM) && 
         !(elemContext & CTX_HAS_A_PARAM_ERR)) {
        if (this.pt === ERR_NONE_YET && t !== ERR_NONE_YET) {
          this.pt = t; this.pe = elemCore; this.po = elem;
        }
        if (this.pt !== ERR_NONE_YET) {
          pt = this.pt; pe = this.pe; po = this.po;
          elemContext |= CTX_HAS_A_PARAM_ERR;
        }
      }
      if ((elemContext & CTX_PAT) &&
         !(elemContext & CTX_HAS_AN_ASSIG_ERR)) {
        if (this.at === ERR_NONE_YET && t !== ERR_NONE_YET) {
          this.at = t; this.ae = elemCore; this.ao = elem;
        }
        if (this.at !== ERR_NONE_YET) {
          at = this.at; ae = this.ae; ao = this.ao;
          elemContext |= CTX_HAS_AN_ASSIG_ERR;
        }
      }
      if (!(elemContext & CTX_HAS_A_SIMPLE_ERR)) {
        if (this.st !== ERR_NONE_YET) {
          st = this.st; se = this.se; so = this.so;
          elemContext |= CTX_HAS_A_SIMPLE_ERR;
        }
      }
    }

    hasRest = hasNonTailRest = false;
  }

  
  if ((context & CTX_PARAM) && pt !== ERR_NONE_YET) {
    this.pt = pt; this.pe = pe; this.po = po; 
  }
  if ((context & CTX_PAT) && at !== ERR_NONE_YET) {
    this.at = at; this.ae = ae; this.ao = ao;
  }
  if ((context & CTX_PARPAT) && st !== ERR_NONE_YET) {
    this.st = st; this.se = se; this.so = so;
  }

  var n = {
    type: 'ArrayExpression',
    loc: { start: startLoc, end: this.loc() },
    start: startc,
    end: this.c,
    elements : list /* ,y:-1*/
  };

  this.expectType(']');
  
  return n;
};
