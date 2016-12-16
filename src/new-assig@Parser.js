this.toAssig = function(head, context) {
  if (head === this.ao)
    this.assigError_flush();

  var i = 0, list = null;
  switch (head.type) {
  case 'Identifier':
    if (this.tight && arguments_or_eval(head.name)) {
      if (!(context & CONTEXT_PARAM_OR_PATTERN) &&
         (this.st === ERR_NONE_YET ||
          this.st === ERR_ARGUMENTS_OR_EVAL_DEFAULT))
        this.st = ERR_NONE_YET;

      if (this.st === ERR_NONE_YET) {
        this.st = ERR_ARGUMENTS_OR_EVAL_ASSIGNED;
        this.se = head;
      }
      if (!(context & CONTEXT_PARAM_OR_PATTERN))
        this.simpleError_flush();
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
    while (i < list.length)
      this.toAssig(list[i++], context);
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
    this.assigError_flush();
  }

  if (o === '=') {
    if ((context & CONTEXT_PARAM_OR_PATTERN) &&
       this.st === ERR_ARGUMENTS_OR_EVAL_ASSIGNED)
      this.st = ERR_ARGUMENTS_OR_EVAL_DEFAULT;

    this.toAssig(head);
  }
  else {
    this.ensureSimpAssig(head);
    this.simpleError_flush();
  }

  var right = this.parseNonSeqExpr(PREC_WITH_NO_OP,
    context & CONTEXT_FOR);
 
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
