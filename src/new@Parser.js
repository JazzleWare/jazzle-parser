this.parseNewHead = function () {
  var startc = this.c0, end = this.c, startLoc = this.locBegin(), li = this.li, col = this.col, raw = this.ltraw ;
  this.next () ;
  if ( this.lttype === '.' ) {
     this.next();
     return this.parseMeta(startc ,end,startLoc,{line:li,column:col},raw );
  }

  var head, elem, inner;
  var y = 0; // newHead is itself an exprHead; an exprHead is always called at the start of a nonSeqExpr,
             // where this.y is set 0
  switch (this  .lttype) {
    case 'Identifier':
       head = this.parseIdStatementOrId (CONTEXT_NONE);
       this.scope.reference(head.name);
       break;

    case '[':
       head = this. parseArrayExpression(CONTEXT_UNASSIGNABLE_CONTAINER);
       break ;

    case '(':
       head = this. parseParen() ;
       break ;

    case '{':
       head = this. parseObjectExpression(CONTEXT_UNASSIGNABLE_CONTAINER) ;
       break ;

    case '/':
       head = this. parseRegExpLiteral () ;
       break ;

    case '`':
       head = this. parseTemplateLiteral () ;
       break ;

    case 'Literal':
       head = this.numstr ();
       break ;

    default:
       this['new.head.is.not.valid'](startc, startLoc);

  }

  y = this.y;

  var inner = core( head ) ;
  while ( !false ) {
    switch (this. lttype) {
       case '.':
          this.next();
          elem = this.memberID();
          head =   {  type: 'MemberExpression', property: elem, start: head.start, end: elem.end,
                      loc: { start: head.loc.start, end: elem.loc.end }, object: inner, computed: false, y: y };
          inner = head;
          continue;

       case '[':
          this.next() ;
          elem = this.parseExpr(CONTEXT_NONE) ;
          y += this.y;
          head =  { type: 'MemberExpression', property: core(elem), start: head.start, end: this.c,
                    loc: { start : head.loc.start, end: this.loc() }, object: inner, computed: !false, y: y };
          inner = head ;
          if ( !this.expectType_soft (']') )
            this['mem.unfinished'](startc,startLoc);
 
          continue;

       case '(':
          elem = this. parseArgList();
          y += this.y;
          inner = { type: 'NewExpression', callee: inner, start: startc, end: this.c,
                    loc: { start: startLoc, end: this.loc() }, arguments: elem, y: y };
          if ( !this. expectType_soft (')') )
            this['new.args.is.unfinished'](startc,startLoc);

          this.y = y;
          return inner;

       case '`' :
           this.y = 0;
           elem = this.parseTemplateLiteral () ;
           y += this.y;
           head = {
                type : 'TaggedTemplateExpression' ,
                quasi :elem ,
                start: head.start,
                 end: elem.end,
                loc : { start: head.loc.start, end: elem.loc.end },
                tag : inner,
                y: y
            };
            inner = head;
            continue ;

        default:
            this.y = y;
            return { type: 'NewExpression', callee: inner, start: startc, end: head.end,
                 loc: { start: startLoc, end: head.loc.end }, arguments : [], y: y };

     }
  }
};

