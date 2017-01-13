this.onComment = function(isBlock,c0,loc0,c,loc) {
  var comment = this.onComment_,
      value = this.src.substring(c0,c);

  if (typeof comment === FUNCTION_TYPE) {
    comment(isBlock,value,c0,c,loc0,loc);
  }
  else {
    comment.push({
      type: isBlock ? 'BlockComment' : 'LineComment',
      value: value,
      start: c0,
      end: c,
      loc: { start: loc0, end: loc }
    });
  }
};

this.onToken = function(token) {
  if (token === null) {
    var ttype = "", tval = "";
    switch (this.lttype) {
    case 'op':
    case '--':
    case '-':
    case '/':
      ttype = 'Punctuator';
      tval = this.ltraw;
      break;

    case 'Keyword':
      ttype = 'Keyword';
      tval = this.ltval;
      break;

    case 'u':
      ttype = 'Punctuator';
      tval = this.ltraw;
      break;

    case 'Literal':
      ttype = typeof this.ltval === NUMBER_TYPE ?
        'Numeric' : 'String';
      tval = this.ltraw;
      break;

    case 'Identifier':
      ttype = 'Identifier';
      tval = this.ltraw;
      break;

    case 'Boolean':
    case 'Null':
      ttype = this.lttype;
      tval = this.ltval;
      break;

    default:
      ttype = 'Punctuator';
      tval = this.lttype;
      break;
    }

    token = { type: ttype, value: tval, start: this.c0, end: this.c,
      loc: {
        start: { line: this.li0, column: this.col0 },
        end: { line: this.li, column: this.col } } };
  }

  var onToken_ = this.onToken_;
  if (typeof onToken_ === FUNCTION_TYPE) {
    onToken_(token);
  }
  else
    onToken_.push(token);

};

this.onToken_kw = function(c0,loc0,val) {
  // TODO: val must=== raw
  this.onToken({
    type: 'Keyword',
    value: val,
    start: c0,
    end: c0+val.length,
    loc: {
      start: loc0,
      end: { line: loc0.line, column: loc0.column + val.length }
    }
  });
};
