this.parseArrayExpression = function(context) {

  var startc = this.c - 1,
      startLoc = this.locOn(1);

  this.next();

  var elem = null,
      list = [];
  var elemContext = CONTEXT_NULLABLE;

  elemContext |= (context & CONTEXT_PARAM_OR_PATTERN);
  elemContext |= (context & CONTEXT_PARAM_OR_PATTERN_ERR);

  var pt = ERR_NONE_YET, pe = null, po = null;
  var at = ERR_NONE_YET, ae = null, ao = null;
  var st = ERR_NONE_YET, se = null, so = null;

  if (context & CONTEXT_PARAM_OR_PATTERN) {
    if ((context & CONTEXT_PARAM) &&
       !(context & CONTEXT_HAS_AN_ERR_PARAM)) {
      this.pt = ERR_NONE_YET; this.pe = this.po = null;
    }

    if (!(context & CONTEXT_HAS_AN_ERR_ASSIG)) {
      this.at = ERR_NONE_YET; this.ae = this.ao = null;
    }

    if (!(context & CONTEXT_HAS_AN_ERR_SIMPLE)) {
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
       (elemContext & CONTEXT_PARAM_OR_PATTERN)) {
      // TODO: [...(a),] = 12
      var t = ERR_NONE_YET;
      if (hasNonTailRest)
        t = ERR_NON_TAIL_REST;
      else if (elem.type === PAREN_TYPE)
        t = ERR_PAREN_UNBINDABLE;

      if (t !== ERR_NONE_YET) {
        if (this.pt === ERR_NONE_YET) {
          this.pt = t;
          this.pe = this.po = elem;
        }
        if (this.at === ERR_NONE_YET) {
          this.at = t;
          this.ae = this.ao = elem;
        }
      }
      if ((elemContext & CONTEXT_MIGHT_BE_PARAM) && 
         !(elemContext & CONTEXT_HAS_AN_ERR_PARAM)) {
        if (this.pt !== ERR_NONE_YET) {
          pt = this.pt; pe = this.pe; po = this.po;
          elemContext |= CONTEXT_HAS_AN_ERR_PARAM;
        }
      }
      if ((elemContext & CONTEXT_MIGHT_BE_PATTERN) &&
         !(elemContext & CONTEXT_HAS_AN_ERR_ASSIG)) {
        if (this.at !== ERR_NONE_YET) {
          at = this.at; ae = this.ae; ao = this.ao;
          elemContext |= CONTEXT_HAS_AN_ERR_ASSIG;
        }
      }
      if (!(elemContext & CONTEXT_HAS_AN_ERR_SIMPLE)) {
        if (this.st !== ERR_NONE_YET) {
          st = this.st; se = this.se; so = this.so;
          elemContext |= CONTEXT_HAS_AN_ERR_SIMPLE;
        }
      }
    }

    hasRest = hasNonTailRest = false;
  }

  
  if ((context & CONTEXT_CAN_BE_PARAM) && pt !== ERR_NONE_YET) {
    this.pt = pt; this.pe = pe; this.po = po; 
  }
  if ((context & CONTEXT_CAN_BE_PATTERN) && at !== ERR_NONE_YET) {
    this.at = at; this.ae = ae; this.ao = ao;
  }
  if ((context & CONTEXT_PARAM_OR_PATTERN) && st !== ERR_NONE_YET) {
    this.st = st; this.se = se; this.so = so;
  }

  elem = {
    type: 'ArrayExpression',
    loc: { start: startLoc, end: this.loc() },
    start: startc,
    end: this.c,
    elements : list /* ,y:-1*/
  };

  this.expectType(']');
  
  return elem;
};
