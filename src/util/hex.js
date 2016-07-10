var hexD = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];

function hex(number) {
  var str = '';

  str = hexD[number&0xf] + str;
  str = hexD[(number>>=4)&0xf] + str ;
  str = hexD[(number>>=4)&0xf] + str ;
  str = hexD[(number>>=4)&0xf] + str ;

  return str;
}

module.exports.default = module.exports = hex;
