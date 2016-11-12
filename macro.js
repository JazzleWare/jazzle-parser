function Macro() {
  this.def = {};
  this.preprocessors = [];
}

var macro = Macro.prototype;

macro.define = function(sym) {
  this.def[sym+'%'] = true;
};

macro.isOn = function(sym) {
  sym += '%';
  return this.def.hasOwnProperty(sym) && this.def[sym];
};

function findSpecialComment(str, offset, name) {
  var comment = '// #'+name;
  offset = str.indexOf(comment, offset);
  if (offset === -1)
    return null;
  var newline = str.lastIndexOf('\n', offset);
  if (newline === -1)
    newline = 0;

  var nextNewline = str.indexOf('\n', offset+1);

  if (nextNewline === -1)
    nextNewline = str.length;
  
  return { lineStart: newline, name: name, nameStart: offset, lineEnd: nextNewline, nameEnd: offset+comment.length, fullComment: comment };
};

function readCond(str, sp) {
  var not = false;
  var l = str.slice(sp.nameEnd, sp.lineEnd);
  l = /^\s*([^\s]*)\s*$/.exec(l)[1];
  if (l.charAt(0)==='!') { not = true; l = l.slice(1); }
  return { n: not, name: l };
}
  
macro.callOn = function(str) {
  var e = -1;
  var s = 0;
  var fragments = [];

  var list = this.preprocessors, i = 0;
  while (i < list.length)
    str = list[i++].call(this, str);

  while (true) {
    var ifComment = findSpecialComment(str, s, 'if');
    var holds = false;
    if (!ifComment) break;
    if (s !== ifComment.lineStart) fragments.push(str.slice(s,ifComment.lineStart));

    var cond = readCond(str, ifComment);
    holds = this.isOn(cond.name);

    if (cond.n) holds = !holds;
    var current = ifComment;

    var end = findSpecialComment(str, current.lineEnd, 'end');
    if (!end) throw new Error("Unfinished macro at "+current.lineEnd);

    var elseComment = findSpecialComment(str, ifComment.lineEnd, 'else');
    if (elseComment && elseComment.lineStart < end.lineStart) {
      if (holds) {
        fragments.push(str.slice(ifComment.lineEnd, elseComment.lineStart));
        holds = false;
      }
      else { current = elseComment; holds = true; }
    }
    if (holds) fragments.push(str.slice(current.lineEnd, end.lineStart));
    s = end.lineEnd;
  }
  if (s < str.length)
    fragments.push(s === 0 ? str : str.slice(s) );

  return fragments;
};

 module.exports.Macro = Macro;
