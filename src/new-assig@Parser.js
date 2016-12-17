this.toAssig = function(head, context) {
  if (head === this.ao)
    this.currentExprIsAssig();

  var i = 0, list = null;
  switch (head.type) {
  case 'Identifier':
    if (this.tight && arguments_or_eval(head.name)) {
      if (!(context & CTX_PARPAT) &&
         (this.st === ERR_NONE_YET ||
          this.st === ERR_ARGUMENTS_OR_EVAL_DEFAULT))
        this.st = ERR_NONE_YET;

      if (this.st === ERR_NONE_YET) {
        this.st = ERR_ARGUMENTS_OR_EVAL_ASSIGNED;
        this.se = head;
      }
      if (!(context & CTX_PARPAT) ||
         (context & CONTEXT_NON_SIMPLE_ERROR))
        this.currentExprIsSimple();
    }
    return;

  case 'MemberExpression':
    return;

  case 'ObjectExpression':
    i = 0; list = head.properties;
    while (i < list.length)
      this.toAssig(list[i++], context);
    head.type = 'ObjectPattern';
    return;

  case 'ArrayExpression':
    i = 0; list = head.elements;
    while (i < list.length) {
      list[i] && this.toAssig(list[i], context);
      i++ ;
    }
    head.type = 'ArrayPattern';
    return;

  case 'AssignmentExpression':
    // TODO: operator is the one that must be pinned,
    // but head is pinned currently
    if (head.operator !== '=')
      this.err('complex.assig.not.pattern',{tn:head});

    // TODO: the left is not re-checked for errors
    // because it is already an assignable pattern;
    // this requires keeping track of the latest
    // ea error, in order to re-record it if it is
    // also the first error in the current pattern
    if (this.st === ERR_ARGUMENTS_OR_EVAL_DEFAULT &&
       head === this.so)
      this.st = ERR_ARGUMENTS_OR_EVAL_ASSIGNED;

    head.type = 'AssignmentPattern';
    delete head.operator;
    return;

  case 'SpreadElement':
    if (head.argument.type === 'AssignmentExpression')
      this.err('rest.arg.not.valid',{tn:head});
    this.toAssig(head.argument, context);
    head.type = 'RestElement';
    return;

  case 'Property':
    this.toAssig(head.value, context);
    return;

  default:
    this.err('not.assignable',{tn:head});
 
  }
};

this.parseAssignment = function(head, context) {
  var o = this.ltraw;
  if (o === '=>')
    return this.parseArrowFunctionExpression(head);

  if (head.type === PAREN_TYPE) {
    this.at = ERR_PAREN_UNBINDABLE;
    this.ae = this.ao = head;
    this.currentExprIsAssig();
  }

  if (o === '=') {
    if ((context & CTX_PARPAT) &&
       this.st === ERR_ARGUMENTS_OR_EVAL_ASSIGNED)
      this.st = ERR_ARGUMENTS_OR_EVAL_DEFAULT;

    this.toAssig(head);
  }
  else {
    this.ensureSimpAssig(head);
    this.currentExprIsSimple();
  }

  this.next();
  var right = this.parseNonSeqExpr(PREC_WITH_NO_OP,
    context & CTX_FOR);
 
  return {
    type: 'AssignmentExpression',
    operator: o,
    start: head.start,
    end: right.end,
    left: head,
    right: core(right),
    loc: {
      start: head.loc.start,
      end: right.loc.end
    }/* ,y:-1*/
  };
};
