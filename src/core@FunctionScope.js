this.hasOwnArguments = function() {
  return !this.isArrow();
};

this.enterUniqueArgs = function() {
  if (this.insideUniqueArgs())
    return;
  switch (this.type & ~(ST_DECL|ST_EXPR)) {
  case ST_GEN:
  case ST_FN:
  case ST_CTOR:
  case ST_METH:
  case ST_ARROW:
    this.mode |= SM_INARGS;
    break;
  default:
    ASSERT.call(this, false,
      'args mode can only be used for a func-like'+
      ' scope and it must be the first sub-mode');
  }

  if (this.firstDup)
    this.parser.err('argsdup');

  this.mode |= SM_UNIQUE;
};

this.exitUniqueArgs = function() {
  ASSERT.call(this, this.insideUniqueArgs(),
    'can not unset unique when it has not been set');

  this.mode &= ~SM_UNIQUE;
};

this.enterFuncArgs = function() {
  this.mode |= SM_INARGS;
};

this.exitFuncArgs = function() {
  ASSERT.call(this, this.insideFuncArgs(),
    'can not get out of an argument list when not in it');
  this.mode &= ~SM_INARGS;
};
