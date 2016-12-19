var Num,num = Num = function (c) { return (c >= CH_0 && c <= CH_9)};
function isIDHead(c) {
  return (c <= CH_z && c >= CH_a) ||
          c === CH_$ ||
         (c <= CH_Z && c >= CH_A) ||
          c === CH_UNDERLINE ||
         (IDS_[c >> D_INTBITLEN] & (1 << (c & M_INTBITLEN)));
};

function isIDBody (c) {
  return (c <= CH_z && c >= CH_a) ||
          c === CH_$ ||
         (c <= CH_Z && c >= CH_A) ||
          c === CH_UNDERLINE ||
         (c <= CH_9 && c >= CH_0) ||
         (IDC_[c >> D_INTBITLEN] & (1 << (c & M_INTBITLEN)));
};

function isHex(e) {
    return ( e >= CH_a && e <= CH_f ) ||
           ( e >= CH_0 && e <= CH_9 ) ||
           ( e >= CH_A && e <= CH_F );
}


