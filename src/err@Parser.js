this.err = function(errorType, errParams) {
  errParams = this.normalize(errParams);
  return this.errorListener.onErr(errorType, errParams);
};

var exclusivity = {
  c0: {tn: 1}, c: {tn: 1},
  li0: {loc0: 1,tn: 1}, li: {loc: 1,tn: 1},
  col0: {loc0: 1, tn: 1}, col: {loc: 1, tn: 1},
  parser: {}, extra: {},
  loc0: {tn: 1, li0: 1, col0: 1},
  loc: {tn: 1, li: 1, col: 1},
  tn: { 
    c0: 1, c: 1,
    col0: 1, li0: 1,
    col: 1, li: 1,
    loc0: 1, loc: 1
  }
}; 

this.getExclusivity = function(name, obj) {
  if (!HAS.call(exclusivity, name))
    throw new Error('no map for ' + name);
  var clashes = null;
  for (var n in exclusivity[name]) {
    if (!HAS.call(obj, n))
      continue;
    if (clashes === null)
      clashes = [];
    clashes.push(n);
  }
  return clashes;
};

this.verifyExclusivity = this.veri = function(name, obj) {
  var e = this.getExclusivity(name, obj);
  if (!e) return; 
      
  throw new Error("clashing error; name '"+name+"'; clash list: ["+e.join(", ")+"]");
};

this.normalize = function(err) {
  // normalized err
  var e = {
    c0: -1, li0: -1, col0: -1,
    c: -1, li: -1, col: -1,
    tn: null,
    parser: this,
    extra: null
  };
  
  if (err) {
    var i = 0;
    while (i < NORMALIZE_COMMON.length) {
      var name = NORMALIZE_COMMON[i];
      if (HAS.call(err, name)) {
        this.veri(name, err);
        e[name] = err[name];
      }
      i++;
    } 
    if (HAS.call(err, 'tn')) {
      this.veri('tn', err);
      var t = err.tn;
      e.c0 = t.start; e.li0 = t.loc.start.line; e.col0 = t.loc.start.column;
      e.c = t.end; e.li = t.loc.end.line; e.col = t.loc.end.column;
      e.tn = err.tn; 
    }
    if (HAS.call(err, 'loc0')) {
      this.veri('loc0', err);
      e.li0 = err.loc0.line; e.col0 = err.loc0.column; 
    }
    if (HAS.call(err, 'loc')) {
      this.veri('loc', err);
      e.li = err.loc.line; e.col = err.loc.column;
    }
    if (HAS.call(err, 'extra')) { e.extra = err.extra; }
  }

  return e;
};

