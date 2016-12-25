this.parseParen = function(context) {
  var startc = this.c0,
      startLoc = this.locBegin(),
      elem = null,
      elemContext = CTX_NULLABLE|CTX_PAT,
      list = null;
  
  var prevys = this.suspys,
      hasRest = false,
      st = ERR_NONE_YET, se = null, so = null,
      pt = ERR_NONE_YET, pe = null, po = null; 

  if (context & CTX_PAT) {
    this.pt = this.st = ERR_NONE_YET;
    this.pe = this.po =
    this.se = this.so = null;
    this.suspys = null;
    elemContext |= CTX_PARAM;
  }
  else
    context |= CTX_NO_SIMPLE_ERR;

  var lastElem = null, hasTailElem = false;
  this.next();
  while (true) {
    lastElem = elem;
    elem = this.parseNonSeqExpr(PREC_WITH_NO_OP, elemContext);
    if (elem === null) {
      if (this.lttype === '...') {
        if (!(elemContext & CTX_PARAM)) {
          this.st = ERR_UNEXPECTED_REST;
          this.se = this.so = null;
          this.currentExprIsSimple();
        }
        elem = this.parseSpreadElement(elemContext);
        hasRest = true;
      }
      else if (list) {
        if (this.v < 7)
          this.err('unexpected.lookahead');
        else 
          hasTailElem = true;
      } 
      else break;
    }

    if (elemContext & CTX_PARAM) {
      // TODO: could be `pt === ERR_NONE_YET`
      if (!(elemContext & CTX_HAS_A_PARAM_ERR)) {
        if (this.pt === ERR_NONE_YET && !hasTailElem) {
          // TODO: function* l() { ({[yield]: (a)})=>12 }
          if (elem.type === PAREN_NODE) {
            this.pt = ERR_PAREN_UNBINDABLE;
            this.pe = elem;
          }
          else if(this.suspys) {
            this.pt = ERR_YIELD_OR_SUPER;
            this.pe = this.suspys;
          }
        }
        if (this.pt !== ERR_NONE_YET) {
          pt = this.pt; pe = this.pe; po = core(elem);
          elemContext |= CTX_HAS_A_PARAM_ERR;
        }
      }

      // TODO: could be `st === ERR_NONE_YET`
      if (!(elemContext & CTX_HAS_A_SIMPLE_ERR)) {
        if (this.st === ERR_NONE_YET) {
          if (hasRest) {
            this.st = ERR_UNEXPECTED_REST;
            this.se = elem;
          }
          else if (hasTailElem) {
            this.st = ERR_NON_TAIL_EXPR;
            this.se = lastElem;
          }
        }
        if (this.st !== ERR_NONE_YET) {
          st = this.st; se = this.se; so = elem && core(elem);
          elemContext |= CTX_HAS_A_SIMPLE_ERR;
        }
      }
    }

    if (hasTailElem)
      break;

    if (list) list.push(core(elem));
    if (this.lttype === ',') {
      if (hasRest)
        this.err('unexpected.lookahead');
      if (list === null)
        list = [core(elem)];
      this.next();
    }
    else break;
  }

  var n = {
      type: PAREN_NODE,
      expr: list ? {
        type: 'SequenceExpression',
        expressions: list,
        start: list[0].start,
        end: list[list.length-1].end,
        loc: {
          start: list[0].loc.start,
          end: list[list.length-1].loc.end
        } 
      } : elem && core(elem),
      start: startc,
      end: this.c,
      loc: { start: startLoc, end: this.loc() }
  };

  if (!this.expectType_soft(')'))
    this.err('unfinished.paren');

  if (context & CTX_PAT) {
    if (elem === null && list === null) {
      st = ERR_EMPTY_LIST_MISSING_ARROW;
      se = so = n;
    }
    if (pt !== ERR_NONE_YET) {
      this.pt = pt; this.pe = pe; this.po = po;
    }
    if (st !== ERR_NONE_YET) {
      this.st = st; this.se = se; this.so = so;
    }
    if (list === null && elem !== null &&
       elem.type === 'Identifier' && elem.name === 'async')
      this.parenAsync = n;
  }

  if (prevys !== null)
    this.suspys = prevys;

  return n;
};

