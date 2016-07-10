var CHAR = require('../../util/char.js');

module.exports.readStrLiteral = function(start) {
  this.li0 = this.li;
  this.col0 = this.col;
  this.c0 = this.c;
  var c = this.c += 1,
    l = this.src,
    e = l.length,
    i = 0,
    v = '',
    v_start = c,
    startC = c - 1;
  while (c < e && (i = l.charCodeAt(c)) !== start) {
    switch (i) {
    case CHAR.BACK_SLASH:
      v += l.slice(v_start, c);
      this.col += (c - startC);
      startC = this.c = c;
      v += this.readEsc();
      c = this.c;
      if (this.col == 0) startC = c + 1;
      else {
        this.col += (c - startC);
        startC = c;
      }
      v_start = ++c;
      continue;
    case CHAR.CARRIAGE_RETURN:
      if (l.charCodeAt(c + 1) == CHAR.LINE_FEED) c++;
      break;
    case CHAR.LINE_FEED:
    case 0x2028:
    case 0x2029:
      this.err('a newline can not appear in a str literal');
    }
    c++;
  }
  if (v_start != c) {
    v += l.slice(v_start, c);
  }
  if (!(c < e && (l.charCodeAt(c)) === start)) {
    this.err('s lit open');
  }
  this.c = c + 1;
  this.col += (this.c - startC);
  this.lttype = 'Literal';
  this.ltraw = l.slice(this.c0, this.c);
  this.ltval = v;
};
