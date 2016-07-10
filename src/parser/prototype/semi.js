module.exports.semiLoc =  function() {
  switch (this.lttype) {
  case ';':
    var n = this.loc();
    this.next();
    return n;

  case 'eof':
    return this.newLineBeforeLookAhead ? null : this.loc();

  case '}':
    if ( !this.newLineBeforeLookAhead )
      return this.locOn(1);
  }
  if (this.newLineBeforeLookAhead) return null;

  console.log('EOS expected; found ' + this.ltraw ) ;
};

module.exports.semiI = function() {
  return this.lttype === ';' ? this.c : this.newLineBeforeLookAhead ? 0 : this.lttype === '}' ? this.c - 1 : this.lttype === 'eof' ? this.c : 0; };
