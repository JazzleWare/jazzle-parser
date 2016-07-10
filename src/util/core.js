var CONST = require('./constants.js');

function core(n) {
  return n.type === CONST.PAREN ? n.expr : n;
}

module.exports.default = module.exports = core;
