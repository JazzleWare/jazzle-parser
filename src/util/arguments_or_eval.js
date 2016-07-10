function arguments_or_eval(l) {
  switch ( l ) {
  case 'arguments':
  case 'eval':
    return !false;
  }

  return false;
}

module.exports.default = module.exports = arguments_or_eval;
