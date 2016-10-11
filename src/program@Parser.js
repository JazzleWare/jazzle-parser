this.parseProgram = function () {
  var startc = this.c, li = this.li, col = this.col;
  var endI = this.c , startLoc = null;
  this.next();
  var list = [];
  var elem = this.parseStatement(!false);
  if (elem &&
      elem.type === 'ExpressionStatement' && 
      elem.expression.type === 'Literal' &&
      typeof elem.expression.value === typeof "") {
    switch (this.src.substring(elem.expression.start, elem.expression.end)) {
      case '"use strict"':
      case "'use strict'":
         this.tight = !false
    }
  }

  while (elem) {
    list.push(elem);
    elem = this.parseStatement(!false);
  } 

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


