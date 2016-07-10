var CHAR = require('./char.js');

function toNum (n) {
  return (n >= CHAR[0] && n <= CHAR[9]) ? n - CHAR[0] :
         (n <= CHAR.f && n >= CHAR.a) ? 10 + n - CHAR.a :
         (n >= CHAR.A && n <= CHAR.F) ? 10 + n - CHAR.A : -1;
}

module.exports.default = module.exports = toNum;
