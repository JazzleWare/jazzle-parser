
function assert(condition, message) {
  if (!condition) throw new Error(message);
}

module.exports.default = module.exports = assert;
