this.parseMeth = function(name, flags) {
  if (this.lttype !== '(')
    this.err('meth.paren');
  var val = null;
  if (flags & MEM_CLASS) {
    // all modifiers come at the beginning
    if (flags & MEM_STATIC) {
      if (flags & MEM_PROTOTYPE)
        this.err('class.prototype.is.static.mem',{tn:name,extra:flags});

      flags &= ~(MEM_CONSTRUCTOR|MEM_SUPER);
    }

    if (flags & MEM_CONSTRUCTOR) {
      if (flags & MEM_SPECIAL)
        this.err('class.constructor.is.special.mem',{tn:name, extra:{flags:flags}});
      if (flags & MEM_HAS_CONSTRUCTOR)
        this.err('class.constructor.is.a.dup',{tn:name});
    }

    val = this.parseFunc(CTX_NONE, flags);

    return {
      type: 'MethodDefinition', key: core(name),
      start: name.start, end: val.end,
      kind: (flags & MEM_CONSTRUCTOR) ? 'constructor' : (flags & MEM_GET) ? 'get' :
            (flags & MEM_SET) ? 'set' : 'method',
      computed: name.type === PAREN,
      loc: { start: name.loc.start, end: val.loc.end },
      value: val, 'static': !!(flags & MEM_STATIC)/* ,y:-1*/
    }
  }
   
  val = this.parseFunc(CTX_NONE, flags);

  return {
    type: 'Property', key: core(name),
    start: name.start, end: val.end,
    kind:
     !(flags & MEM_ACCESSOR) ? 'init' :
      (flags & MEM_SET) ? 'set' : 'get',
    computed: name.type === PAREN,
    loc: { start: name.loc.start, end : val.loc.end },
    method: (flags & MEM_ACCESSOR) === 0, shorthand: false,
    value : val/* ,y:-1*/
  }
};

