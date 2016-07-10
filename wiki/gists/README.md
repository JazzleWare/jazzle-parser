 an arrays's first paren is the first elem found of type 'paren', or the first elem after which the '`first` is non-null
 a paren's first paren is the first elem found of type 'paren', or the first elem after which the '`first' is non-null
 an obj's first paren is the first elem found of type 'paren', or the first elem after which the '`first' is non-null


 an array's first unassignable is the first elem after which the '`unassignable' is non-null
 a paren's unassignable is the expression it contains, unless the expression is an id or mem, in which case the unassignable is null
 an obj's unassignable is the first elem after which the '`unassignable' is non-null            
       

 a NonSeqExpr that might start an assignment ( i.e., one with a PREC_WITH_NO_OP precedence ) will have first paren if its head is of type paren, or the if the `first is non-null after the head is calculated (with `exprHead(), or if it returns null, with `u() )


 a NonSeqExpr that might start an assignment ( i.e., one with a PREC_WITH_NO_OP precedence) will have an unassignable paren if `unassignable is set after the head is calculated (with `exprHead(), or if it returns null, with `u() )


 all of the parse functions listd above must update the `first and `unassignable before returning and after calling any parseExpr-related function
  
if we are in versions less than 5, then they are mere id's.
if they come at the start of a for, they are sent to parseLetConst with the context CONTEXT_FOR
if they come at the start of a statement, they are sent to parseLetConst
if they are anywhere else, they would be mere id's, unless we are in strict mode, in which case they are reserved words (and cause an error.)


The parseLetConst function always parses a declaration; however if the returned declaration has no declarators, it returns an id ,     unless we are in strict mode, in which case they are reserved words (and cause an error.)
 
