this.semiLoc_soft = function () {
  switch (this.lttype) {
  case ';':
     var n = this.loc();
     this.next();
     return n;

  case 'eof':
     return this.nl ? null : this.loc();

  case '}':
     if ( !this.nl )
        return this.locOn(1);
  }
  
  return null;
};

this.semiI = function() {
   return this.lttype === ';' ? this.c : this.nl ? 0 : this.lttype === '}' ? this.c - 1 : this.lttype === 'eof' ? this.c : 0; };


