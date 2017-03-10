this.verifyForStrictness = function() {
  if (this.firstDup)
    this.parser.err('argsdup');
  if (this.firstNonSimple)
    this.parser.err('non.simple');
};

this.exitUniqueArgs = function() {
  ASSERT.call(this, this.insideUniqueArgs(),
    'can not unset unique when it has not been set');

  this.mode &= ~SM_UNIQUE;
};

this.enterUniqueArgs = function() {
  if (this.firstDup)
    this.parser.err('argsdup');
  if (this.insideUniqueArgs())
    return;

  this.mode |= SM_UNIQUE;
};
