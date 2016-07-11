var CONST = require('../../util/constants.js');
var CONTEXT = CONST.CONTEXT;
var PREC = require('../../util/precedence.js');

module.exports.parseClass = function(context) {
  var startc = this.c0;
  var startLoc = this.locBegin();

  var canBeStatement = this.canBeStatement, name = null;
  this.next();

  if (canBeStatement && context !== CONTEXT.DEFAULT) {
    this.canBeStatement = false;
    this.assert ( this.lttype === 'Identifier' );
    name = this. validateID(null);
  } else if ( this.lttype === 'Identifier' && this.ltval !== 'extends' ) {
    name = this.validateID(null);
  }

  var classExtends = null;
  if ( this.lttype === 'Identifier' && this.ltval === 'extends' ) {
    this.next();
    classExtends = this.parseNonSeqExpr(PREC.WITH_NO_OP, CONTEXT.NONE);
  }

  var list = [];
  var nbodyStartc = this.c - 1, nbodyStartLoc = this.locOn(1);

  this.expectType ( '{' ) ;
  var elem = null, foundConstructor = false;

  var startcStatic, liStatic, colStatic, rawStatic, cStatic, startLocStatic;
  var isStatic = false;

  WHILE:
  while (!false) { // eslint-disable-line no-constant-condition
    if ( this.lttype === 'Identifier' && this.ltval === 'static' ) {
      startcStatic = this.c0;
      rawStatic = this.ltraw;
      colStatic = this.col;
      liStatic = this.li;
      cStatic = this.c;
      startLocStatic = this.locBegin();

      this.next();

      if ( this.lttype === '(' ) {
        elem = this.parseMeth({
          type: 'Identifier', name: 'static', start: startcStatic,
          end: cStatic, raw: rawStatic, loc: { start: startLocStatic, end: {
            line: liStatic, column: colStatic
          }}
        }, !CONST.OBJ_MEM);
        list.push(elem);
        continue;
      }
      isStatic = !false;
    }

    SWITCH:
    switch ( this.lttype ) {
    case 'Identifier':
      switch ( this.ltval ) {
      case 'get': case 'set':
        elem = this.parseSetGet(!CONST.OBJ_MEM);
        break SWITCH;
      case 'constructor':
        this.assert( !foundConstructor );
        if ( !isStatic ) foundConstructor = !false;
        // fall through
      default:
        elem = this.parseMeth(this.id(), !CONST.OBJ_MEM);
        break SWITCH;
      }

    case '[':
      elem = this.parseMeth(this.memberExpr(), !CONST.OBJ_MEM);
      break SWITCH;

    case 'Literal':
      elem = this.parseMeth(this.numstr(), !CONST.OBJ_MEM);
      break SWITCH;

    case ';':
      this.next();
      continue;

    case 'op':
      if ( this.ltraw === '*' ) {
        elem = this.parseGen(!CONST.OBJ_MEM);
      }
      break SWITCH;

    default:
      break WHILE;
    }

    if ( isStatic ) {
      if ( elem.kind === 'constructor')
        elem.kind = 'method';

      elem.start = startcStatic;
      elem.loc.start = startLocStatic;
      elem['static'] = !false;
      isStatic = false;
    }

    list.push(elem);
  }

  var endLoc = this.loc();
  var n = {
    type: canBeStatement ? 'ClassDeclaration' : 'ClassExpression',
    id: name,
    start: startc,
    end: this.c,
    superClass: classExtends,
    loc: { start: startLoc, end: endLoc },
    body: {
      type: 'ClassBody',
      loc: { start: nbodyStartLoc, end: endLoc },
      start: nbodyStartc,
      end: this.c,
      body: list
    }
  };

  this.expectType('}');
  if (canBeStatement) { this.foundStatement = !false; }

  return n;
};
