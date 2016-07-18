function Regex(src,flagsMask) {
   this.src = src;
   this.c = 0;

   this.flagsMask = flagsMask;
}


var rp = Regex.prototype;

rp.verify = function() {
   while ( this.next() >= 0 );
};

rp.expect = function(charcode) {
   this.assert(this.c < this.src.length);
   this.assert(this.src.charCodeAt(this.c)  === charcode);
   this.c++;
};

rp.optionalExpect = function(charcode) {
   if ( this.c < this.src.length &&
        this.src.charCodeAt(this.c) === charcode )
        this.c++;
};


