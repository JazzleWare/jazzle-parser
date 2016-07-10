var char2int = require('./char2int.js');

module.exports = {
  // 0-9
  '0': char2int('0'),
  '1': char2int('1'),
  '2': char2int('2'),
  '3': char2int('3'),
  '4': char2int('4'),
  '5': char2int('5'),
  '6': char2int('6'),
  '7': char2int('7'),
  '8': char2int('8'),
  '9': char2int('9'),

  // A-Za-z
  // FIXME: missing letters?
  'a':  char2int('a'), 'A':  char2int('A'),
  'b':  char2int('b'), 'B':  char2int('B'),
  'e':  char2int('e'), 'E':  char2int('E'),
  'g':  char2int('g'),
  'f':  char2int('f'), 'F':  char2int('F'),
  'i':  char2int('i'),
  'm':  char2int('m'),
  'n':  char2int('n'),
  'o':  char2int('o'), 'O':  char2int('O'),
  'r':  char2int('r'),
  't':  char2int('t'),
  'u':  char2int('u'), 'U':  char2int('U'),
  'v':  char2int('v'), 'X':  char2int('X'),
  'x':  char2int('x'),
  'y':  char2int('y'),
  'z':  char2int('z'), 'Z':  char2int('Z'),

  // other characters
  'UNDERLINE': char2int('_'),
  '$': char2int('$'),

  'TAB': char2int('\t'),
  'CARRIAGE_RETURN': char2int('\r'),
  'LINE_FEED': char2int('\n'),
  'VTAB': char2int('\v'),
  'FORM_FEED': char2int( '\f') ,

  'WHITESPACE': char2int(' '),

  'BACKTICK': char2int('`'),
  'SINGLE_QUOTE': char2int('\''),
  'MULTI_QUOTE': char2int('"'),
  'BACK_SLASH': char2int(('\\')),

  'DIV': char2int('/'),
  'MUL': char2int('*'),
  'MIN': char2int('-'),
  'ADD': char2int('+'),
  'AND': char2int('&'),
  'XOR': char2int('^'),
  'MODULO': char2int('%'),
  'OR': char2int('|'),
  'EQUALITY_SIGN': char2int('='),

  'SEMI': char2int(';'),
  'COMMA': char2int(','),
  'SINGLEDOT': char2int('.'),
  'COLON': char2int((':')),
  'QUESTION': char2int('?'),

  'EXCLAMATION': char2int('!'),
  'COMPLEMENT': char2int('~'),

  'ATSIGN': char2int('@'),

  'LPAREN': char2int('('),
  'RPAREN': char2int(')'),
  'LSQBRACKET': char2int('['),
  'RSQBRACKET': char2int(']'),
  'LCURLY': char2int('{'),
  'RCURLY': char2int('}'),
  'LESS_THAN': char2int('<'),
  'GREATER_THAN': char2int('>')
};
