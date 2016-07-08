var Num,num = Num = function (c) { return (c >= CHAR_0 && c <= CHAR_9)};
function isIDHead(c) {
  return (c <= CHAR_z && c >= CHAR_a) ||
          c === CHAR_$ ||
         (c <= CHAR_Z && c >= CHAR_A) ||
          c === CHAR_UNDERLINE ||
         (IDS_[c >> D_INTBITLEN] & (1 << (c & M_INTBITLEN)));
};

function isIDBody (c) {
  return (c <= CHAR_z && c >= CHAR_a) ||
          c === CHAR_$ ||
         (c <= CHAR_Z && c >= CHAR_A) ||
          c === CHAR_UNDERLINE ||
         (c <= CHAR_9 && c >= CHAR_0) ||
         (IDC_[c >> D_INTBITLEN] & (1 << (c & M_INTBITLEN)));
};

function isHex(e) {
    return ( e >= CHAR_a && e <= CHAR_f ) ||
           ( e >= CHAR_0 && e <= CHAR_9 ) ||
           ( e >= CHAR_A && e <= CHAR_F );
}


