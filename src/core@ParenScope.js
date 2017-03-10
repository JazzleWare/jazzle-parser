this.dissolve = function() {
  var refs = this.refs, parent = this.parent;
  var list = refs.keys, i = 0;
  while (i < list.length) {
    var mname = list[i],
        elem = refs.get(mname),
        ref = parent.findRef_m(mname, true);

    ref.direct.fw += elem.direct.fw; 
    ref.direct.ex += elem.direct.ex;

    ref.indirect.fw += elem.indirect.fw;
    ref.indirect.ex += elem.indirect.ex;

    i++;
  }
};

this.finish = function() {};
