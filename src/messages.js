var Errors = {};

Errors['u.token'] = "Unexpected token {0}";
Errors['u.invalid.token'] = "Unexpected {0}";
Errors['u.newline']= "Unexpected line terminator";
Errors['u.eos']= "Unexpected end of input";
Errors['u.num']= "Unexpected #{toktype(arg.tok)}";
Errors['u.newline']= "Unexpected line terminator";
Errors['u.comma.after.rest'] = "Unexpected comma after rest";
Errors['err.throw.newline'] = "Illegal newline after throw";
Errors['err.regex.incompl'] = "Invalid regular expression= missing /";
Errors['err.regex.flags'] = "Invalid regular expression flags";
Errors['err.assig.not'] = "Invalid left-hand side in assignment";
Errors['err.bind.not']= "Invalid left-hand side in binding";
Errors['err.assig.for-in']= "Invalid left-hand side in for-in";
Errors['err.assig.for-of']= "Invalid left-hand side in for-of";
Errors['err.assig.simple.not']= "Increment/decrement target must be an identifier or member expression";
Errors['err.switch.multi']= "More than one default clause in switch statement";
Errors['err.try.tail.no']= "Missing catch or finally after try";
Errors['err.ret.not.allowed'] = "Illegal return statement";
Errors['err.arrow.arg']= "Illegal arrow function parameter list";
Errors['err.for.init.decl'] = "Invalid variable declaration in for-in statement";
Errors['err.prop.init'] = "Illegal property initializer";

