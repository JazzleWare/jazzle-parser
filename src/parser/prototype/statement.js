var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var SCOPE = CONST.SCOPE;
var core = require('../../util/core.js');
var has = require('../../util/has.js');

module.exports.parseStatement = function(allowNull) {
  var head = null, e;
  // var l; // unused
  switch (this.lttype) {
  case '{':
    return this.parseBlckStatement();
  case ';':
    return this.parseEmptyStatement();
  case 'Identifier':
    this.canBeStatement = !false;
    head = this.parseIdStatementOrId(CONTEXT.NONE);
    if (this.foundStatement) {
      this.foundStatement = false;
      return head;
    }
    break;
  case 'eof':
    this.assert(allowNull);
    return null;
  }
  this.assert(head === null);
  head = this.parseExpr(CONTEXT.NULLABLE);
  if (!head) {
    this.assert(allowNull, 'statement must not be null');
    return null;
  }
  if (head.type == 'Identifier' && this.lttype == ':')
    return this.parseLabeledStatement(head, allowNull);
  this.fixupLabels(false);
  e = this.semiI() || head.end;
  return {
    type: 'ExpressionStatement',
    expression: core(head),
    start: head.start,
    end: e,
    loc: {
      start: head.loc.start,
      end: this.semiLoc() || head.loc.end
    }
  };
};
module.exports.findLabel = function(name) {
  return has.call(this.labels, name) ? this.labels[name] : null;
};
module.exports.parseLabeledStatement = function(label, allowNull) {
  this.next();
  var l = label.name;
  l += '%';
  this.assert(!this.findLabel(l));
  this.labels[l] =
    this.unsatisfiedLabel ?
    this.unsatisfiedLabel :
    this.unsatisfiedLabel = {
      loop: false
    };
  var stmt = this.parseStatement(allowNull);
  this.labels[l] = null;
  return {
    type: 'LabeledStatement',
    label: label,
    start: label.start,
    end: stmt.end,
    loc: {
      start: label.loc.start,
      end: stmt.loc.end
    },
    body: stmt
  };
};
module.exports.ensureStmt = function() {
  if (this.canBeStatement) this.canBeStatement = false;
  else this.assert(false);
};
module.exports.fixupLabels = function(loop) {
  if (this.unsatisfiedLabel) {
    this.unsatisfiedLabel.loop = loop;
    this.unsatisfiedLabel = null;
  }
};
module.exports.parseEmptyStatement = function() {
  var n = {
    type: 'EmptyStatement',
    start: this.c - 1,
    loc: {
      start: this.locOn(1),
      end: this.loc()
    },
    end: this.c
  };
  this.next();
  return n;
};
module.exports.parseIfStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  this.expectType('(');
  var cond = core(this.parseExpr(CONTEXT.NONE));
  this.expectType(')');
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= SCOPE.BREAK;
  var nbody = this.parseStatement(false);
  this.scopeFlags = scopeFlags;
  var alt = null;
  if (this.lttype === 'Identifier' && this.ltval === 'else') {
    this.next();
    alt = this.parseStatement(!false);
  }
  this.foundStatement = !false;
  return {
    type: 'IfStatement',
    test: cond,
    start: startc,
    end: (alt || nbody).end,
    loc: {
      start: startLoc,
      end: (alt || nbody).loc.end
    },
    consequent: nbody,
    alternate: alt
  };
};
module.exports.parseWhileStatement = function() {
  this.ensureStmt();
  this.fixupLabels(!false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  this.expectType('(');
  var cond = core(this.parseExpr(CONTEXT.NONE));
  this.expectType(')');
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= (SCOPE.CONTINUE | SCOPE.BREAK);
  var nbody = this.parseStatement(false);
  this.scopeFlags = scopeFlags;
  this.foundStatement = !false;
  return {
    type: 'WhileStatement',
    test: cond,
    start: startc,
    end: nbody.end,
    loc: {
      start: startLoc,
      end: nbody.loc.end
    },
    body: nbody
  };
};
module.exports.parseBlckStatement = function() {
  this.fixupLabels(false);
  var startc = this.c - 1,
    startLoc = this.locOn(1);
  this.next();
  var n = {
    type: 'BlockStatement',
    body: this.blck(),
    start: startc,
    end: this.c,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.expectType('}');
  return n;
};
module.exports.parseDoWhileStatement = function() {
  this.ensureStmt();
  this.fixupLabels(!false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  var scopeFlags = this.scopeFlags;
  this.scopeFlags |= (SCOPE.BREAK | SCOPE.CONTINUE);
  var nbody = this.parseStatement(!false);
  this.scopeFlags = scopeFlags;
  this.expectID('while');
  this.expectType('(');
  var cond = core(this.parseExpr(CONTEXT.NONE));
  var c = this.c,
    li = this.li,
    col = this.col;
  this.expectType(')');
  if (this.lttype === ';') {
    c = this.c;
    li = this.li;
    col = this.col;
    this.next();
  }
  this.foundStatement = !false;
  return {
    type: 'DoWhileStatement',
    test: cond,
    start: startc,
    end: c,
    body: nbody,
    loc: {
      start: startLoc,
      end: {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseContinueStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  this.assert(this.scopeFlags & SCOPE.CONTINUE);
  var startc = this.c0,
    startLoc = this.locBegin();
  var c = this.c,
    li = this.li,
    col = this.col;
  this.next();
  var name = null,
    label = null,
    semi = 0;
  if (!this.newLineBeforeLookAhead && this.lttype === 'Identifier') {
    label = this.validateID(null);
    name = this.findLabel(label.name + '%');
    this.assert(name && name.loop);
    semi = this.semiI();
    this.foundStatement = !false;
    return {
      type: 'ContinueStatement',
      label: label,
      start: startc,
      end: semi || label.end,
      loc: {
        start: startLoc,
        end: this.semiLoc() || label.loc.end
      }
    };
  }
  semi = this.semiI();
  this.foundStatement = !false;
  return {
    type: 'ContinueStatement',
    label: null,
    start: startc,
    end: semi || c,
    loc: {
      start: startLoc,
      end: this.semiLoc() || {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseBreakStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  this.assert(this.scopeFlags & SCOPE.BREAK);
  var startc = this.c0,
    startLoc = this.locBegin();
  var c = this.c,
    li = this.li,
    col = this.col;
  this.next();
  var name = null,
    label = null,
    semi = 0;
  if (!this.newLineBeforeLookAhead && this.lttype === 'Identifier') {
    label = this.validateID(null);
    name = this.findLabel(label.name + '%');
    this.assert(name);
    semi = this.semiI();
    this.foundStatement = !false;
    return {
      type: 'BreakStatement',
      label: label,
      start: startc,
      end: semi || label.end,
      loc: {
        start: startLoc,
        end: this.semiLoc() || label.loc.end
      }
    };
  }
  semi = this.semiI();
  this.foundStatement = !false;
  return {
    type: 'BreakStatement',
    label: null,
    start: startc,
    end: semi || c,
    loc: {
      start: startLoc,
      end: this.semiLoc() || {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseSwitchStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin(),
    cases = [],
    hasDefault = false,
    scopeFlags = this.scopeFlags,
    elem = null;
  this.next();
  this.expectType('(');
  var switchExpr = core(this.parseExpr(CONTEXT.NONE));
  this.expectType(')');
  this.expectType('{');
  this.scopeFlags |= SCOPE.BREAK;
  while ((elem = this.parseSwitchCase())) {
    if (elem.test === null) {
      this.assert(!hasDefault);
      hasDefault = !false;
    }
    cases.push(elem);
  }
  this.scopeFlags = scopeFlags;
  this.foundStatement = !false;
  var n = {
    type: 'SwitchStatement',
    cases: cases,
    start: startc,
    discriminant: switchExpr,
    end: this.c,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.expectType('}');
  return n;
};
module.exports.parseSwitchCase = function() {
  var startc,
    startLoc;
  var nbody = null,
    cond = null;
  if (this.lttype === 'Identifier') switch (this.ltval) {
  case 'case':
    startc = this.c0;
    startLoc = this.locBegin();
    this.next();
    cond = core(this.parseExpr(CONTEXT.NONE));
    break;
  case 'default':
    startc = this.c0;
    startLoc = this.locBegin();
    this.next();
    break;
  default:
    return null;
  }
  else
    return null;
  var c = this.c,
    li = this.li,
    col = this.col;
  this.expectType(':');
  nbody = this.blck();
  var last = nbody.length ? nbody[nbody.length - 1] : null;
  return {
    type: 'SwitchCase',
    test: cond,
    start: startc,
    end: last ? last.end : c,
    loc: {
      start: startLoc,
      end: last ? last.loc.end : {
        line: li,
        column: col
      }
    },
    consequent: nbody
  };
};
module.exports.parseReturnStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  this.assert(this.scopeFlags & SCOPE.FUNCTION);
  var startc = this.c0,
    startLoc = this.locBegin(),
    retVal = null,
    li = this.li,
    c = this.c,
    col = this.col;
  this.next();
  var semi;
  if (!this.newLineBeforeLookAhead)
    retVal = this.parseExpr(CONTEXT.NULLABLE);
  semi = this.semiI();
  if (retVal) {
    this.foundStatement = !false;
    return {
      type: 'ReturnStatement',
      argument: core(retVal),
      start: startc,
      end: semi || retVal.end,
      loc: {
        start: startLoc,
        end: this.semiLoc() || retVal.loc.end
      }
    };
  }
  this.foundStatement = !false;
  return {
    type: 'ReturnStatement',
    argument: retVal,
    start: startc,
    end: semi || c,
    loc: {
      start: startLoc,
      end: this.semiLoc() || {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseThrowStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin(),
    retVal = null,
    li = this.li,
    c = this.c,
    col = this.col;
  this.next();
  var semi;
  if (!this.newLineBeforeLookAhead)
    retVal = this.parseExpr(CONTEXT.NULLABLE);
  semi = this.semiI();
  if (retVal) {
    this.foundStatement = !false;
    return {
      type: 'ThrowStatement',
      argument: core(retVal),
      start: startc,
      end: semi || retVal.end,
      loc: {
        start: startLoc,
        end: this.semiLoc() || retVal.loc.end
      }
    };
  }
  this.foundStatement = !false;
  return {
    type: 'ThrowStatement',
    argument: null,
    start: startc,
    end: semi || c,
    loc: {
      start: startLoc,
      end: this.semiLoc() || {
        line: li,
        column: col
      }
    }
  };
};
module.exports.parseBlockStatement_dependent = function() {
  var startc = this.c - 1,
    startLoc = this.locOn(1);
  this.expectType('{');
  var n = {
    type: 'BlockStatement',
    body: this.blck(),
    start: startc,
    end: this.c,
    loc: {
      start: startLoc,
      end: this.loc()
    }
  };
  this.expectType('}');
  return n;
};
module.exports.parseTryStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  var tryBlock = this.parseBlockStatement_dependent();
  var finBlock = null,
    catBlock = null;
  if (this.lttype === 'Identifier' && this.ltval === 'catch')
    catBlock = this.parseCatchClause();
  if (this.lttype === 'Identifier' && this.ltval === 'finally') {
    this.next();
    finBlock = this.parseBlockStatement_dependent();
  }
  var finOrCat = finBlock || catBlock;
  this.assert(finOrCat);
  this.foundStatement = !false;
  return {
    type: 'TryStatement',
    block: tryBlock,
    start: startc,
    end: finOrCat.end,
    handler: catBlock,
    finalizer: finBlock,
    loc: {
      start: startLoc,
      end: finOrCat.loc.end
    }
  };
};
module.exports.parseCatchClause = function() {
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  this.expectType('(');
  var catParam = this.parsePattern();
  this.expectType(')');
  var catBlock = this.parseBlockStatement_dependent();
  return {
    type: 'CatchClause',
    loc: {
      start: startLoc,
      end: catBlock.loc.end
    },
    start: startc,
    end: catBlock.end,
    param: catParam,
    body: catBlock
  };
};
module.exports.parseWithStatement = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin();
  this.next();
  this.expectType('(');
  var obj = this.parseExpr(CONTEXT.NONE);
  this.expectType(')');
  var nbody = this.parseStatement(!false);
  this.foundStatement = !false;
  return {
    type: 'WithStatement',
    loc: {
      start: startLoc,
      end: nbody.loc.end
    },
    start: startc,
    end: nbody.end,
    object: obj,
    body: nbody
  };
};
module.exports.prseDbg = function() {
  this.ensureStmt();
  this.fixupLabels(false);
  var startc = this.c0,
    startLoc = this.locBegin();
  var c = this.c,
    li = this.li,
    col = this.col;
  this.next();
  if (this.lttype === ';') {
    c = this.c;
    li = this.li;
    col = this.col;
    this.next();
  }
  this.foundStatement = !false;
  return {
    type: 'DebuggerStatement',
    loc: {
      start: startLoc,
      end: {
        line: li,
        column: col
      }
    },
    start: startc,
    end: c
  };
};
module.exports.blck = function() { // blck ([]stmt)
  var stmts = [],
    stmt;
  while ((stmt = this.parseStatement(!false))) stmts.push(stmt);
  return (stmts);
};
