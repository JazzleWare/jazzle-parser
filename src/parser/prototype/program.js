module.exports.parseProgram =  function() {
  var startc = this.c, li = this.li, col = this.col; // FIXME: li unused
  var endI = this.c , startLoc = null;
  this.next();
  var list = this.blck();
  var endLoc = null;
  if (list.length) {
    var firstStatement = list[0];
    startc = firstStatement.start;
    startLoc = firstStatement.loc.start;

    var lastStatement = list[ list.length - 1 ];
    endI = lastStatement.end;
    endLoc = lastStatement.loc.end;
  }
  else {
    endLoc = startLoc = { line: 0, column: 0 };
  }

  var n = { type: 'Program', body: list, start: startc, end: endI, sourceType: !this.isScript ? "module" : "script" ,
           loc: { start: startLoc, end: endLoc } };

  this.expectType('eof');

  return n;
};
