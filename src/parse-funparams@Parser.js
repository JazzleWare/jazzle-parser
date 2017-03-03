this.parseArgs = function (argLen) {
  var c0 = -1, li0 = -1, col0 = -1, tail = true,
      list = [], elem = null;

  if (!this.expectType_soft('('))
    this.err('func.args.no.opening.paren');

  var firstNonSimpArg = null;
  while (list.length !== argLen) {
    elem = this.parsePattern();
    if (elem) {
      if (this.lttype === 'op' && this.ltraw === '=') {
        elem = this.parseAssig(elem);
        this.makeComplex();
      }
      if (!firstNonSimpArg && elem.type !== 'Identifier')
        firstNonSimpArg =  elem;
      list.push(elem);
    }
    else {
      if (list.length !== 0) {
        if (this.v < 7)
          this.err('arg.non.tail.in.func',
            {c0:c0,li0:li0,col0:col0,extra:{list:list}});
      }
      break ;
    }

    if (this.lttype === ',' ) {
      c0 = this.c0, li0 = this.li0, col0 = this.col0;
      this.next();
    }
    else { tail = false; break; }
  }
  if (argLen === ARGLEN_ANY) {
    if (tail && this.lttype === '...') {
      this.makeComplex();
      elem = this.parseRestElement();
      list.push( elem  );
      if ( !firstNonSimpArg )
        firstNonSimpArg = elem;
    }
  }
  else if (list.length !== argLen)
    this.err('func.args.not.enough');

  if (!this.expectType_soft (')'))
    this.err('func.args.no.end.paren');

  if (firstNonSimpArg)
    this.firstNonSimpArg = firstNonSimpArg;
 
  return list;
};


