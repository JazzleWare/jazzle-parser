function fromcode(codePoint ) {
  if (codePoint <= 0xFFFF) return String.fromCharCode(codePoint);

  return String.fromCharCode(
    ((codePoint - 0x10000 ) >> 10) + 0x0D800,
    ((codePoint - 0x10000 ) & (1024 - 1)) + 0x0DC00
  );
}

module.exports.default = module.exports = fromcode;
