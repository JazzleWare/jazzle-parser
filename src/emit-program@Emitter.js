this.emitProgram = function(n, prec, flags) {
  var list = n.body, i = 0;
  while (i < list.length) {
    var stmt = list[i++];
    i > 0 && this.startLine();
    this.emit(stmt, PREC_NONE, EC_NONE);
  }
};
