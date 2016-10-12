this.parseNewHead = function () {
  var startc = this.c0, end = this.c, startLoc = this.locBegin(), li = this.li, col = this.col, raw = this.ltraw ;
  this.next () ;
  if ( this.lttype === '.' ) {
     this.next();
     return this.parseMeta(startc ,end,startLoc,{line:li,column:col},raw );
  }

  var head, elem, inner;
  switch (this  .lttype) {
    case 'Identifier':
       head = this.parseIdStatementOrId (CONTEXT_NONE);
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
       head = this.err('new.head.is.not.valid',startc, startLoc);
       if ( head.type === ERR_RESUME ) {
           head = head.val ;
           break ;
       }
       return head.val;
  }

  var inner = core( head ) ;
  while ( !false ) {
    switch (this. lttype) {
       case '.':
          this.next();
          elem = this.memberID();
          head =   {  type: 'MemberExpression', property: elem, start: head.start, end: elem.end,
                      loc: { start: head.loc.start, end: elem.loc.end }, object: inner, computed: false };
          inner = head;
          continue;

       case '[':
          this.next() ;
          elem = this.parseExpr(CONTEXT_NONE) ;
          head =  { type: 'MemberExpression', property: core(elem), start: head.start, end: this.c,
                    loc: { start : head.loc.start, end: this.loc() }, object: inner, computed: !false };
          inner = head ;
          if ( !this.expectType_soft (']') ) {
            head = this.err('mem.unfinished',startc,startLoc,head)  ;
            if (head .type === ERR_RESUME)
              head = head.val;
     
            else
              return head.val;
          }
 
          continue;

       case '(':
          elem = this. parseArgList();
          inner = { type: 'NewExpression', callee: inner, start: startc, end: this.c,
                    loc: { start: startLoc, end: this.loc() }, arguments: elem };
          if ( !this. expectType_soft (')') ) {
            inner = this.err('new.args.is.unfinished',startc,startLoc,inner) ;
            if ( inner.type === ERR_RESUME )
              inner = inner.val;
            else
              return inner.val;
          }

          return inner;

       case '`' :
           elem = this.parseTemplateLiteral () ;
           head = {
                type : 'TaggedTemplateExpression' ,
                quasi :elem ,
                start: head.start,
                 end: elem.end,
                loc : { start: head.loc.start, end: elem.loc.end },
                tag : inner
            };
            inner = head;
            continue ;

        default: return { type: 'NewExpression', callee: inner, start: startc, end: head.end,
                 loc: { start: startLoc, end: head.loc.end }, arguments : [] };

     }
  }
};

