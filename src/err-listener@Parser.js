this.onErr = function(errorType, errParams) {
   var message = "";
   if (!HAS.call(ErrorBuilders, errorType))
     message = "Error: " + errorType + "\n" +
       this.src.substr(this.c-120,120) +
       ">>>>" + this.src.charAt(this.c+1) + "<<<<" +
       this.src.substr(this.c, 120);

   else {
     var errorBuilder = ErrorBuilders[errorType];  
     var errorInfo = this.buildErrorInfo(errorBuilder, errParams);

     var offset = errorInfo.c0,
         line = errorInfo.li0,
         column = errorInfo.col0,
         errMessage = errorInfo.messageTemplate.applyTo(errParams);

     message += "Error: "+line+":"+column+" (src@"+offset+"): "+errMessage;

     // TODO: add a way to print a 'pinpoint', i.e., the particular chunk of the
     // source code that is causing the error
   }

   throw new Error(message);
};
  
// TODO: find a way to squash it with normalize
this.buildErrorInfo = function(builder, params) {
  var errInfo = {
    messageTemplate: null,
    c: -1, li: -1, col: -1,
    c0: -1, li0: -1, col0: -1
  };

  // TODO: find a way to run this verification when the
  // builder is first added to the ErrorBuilders obj, rather than when the builder
  // is applied to the params given to it
  var i = 0;
  while (i < NORMALIZE_COMMON.length) {
    var name = NORMALIZE_COMMON[i];
    if (HAS.call(builder, name)) {
      this.veri(name, builder);
      errInfo[name] = builder[name].applyTo(params);
    }
    i++;
  }

  if (HAS.call(builder, 'tn')) {
    this.veri('tn', builder);
    var t = builder.tn.applyTo(params);
    errInfo.li0 = t.loc.start.line;
    errInfo.c0 = t.start;
    errInfo.col0 = t.loc.start.column;
    errInfo.li = t.loc.end.line;
    errInfo.c = t.end;
    errInfo.col = t.loc.end.column;
  }
 
  errInfo.messageTemplate = builder.messageTemplate;

  if (builder.preprocessor)
    builder.preprocessor.call(errInfo);
 
  return errInfo;
};

var ErrorBuilders = {};
function a(errorType, builderOutline) {
  if (HAS.call(ErrorBuilders, errorType))
    throw new Error('Error type has already got a builder: <'+errorType+'>');
  var builder = {preprocessor:null};
  for (var name in builderOutline) {
    if (name === 'm')
      builder.messageTemplate = ErrorString.from(builderOutline[name]);
    else if (name === 'p')
      builder.preprocessor = builderOutline.p; 
    else
      builder[name] = Template.from(builderOutline[name]);
  }

  ErrorBuilders[errorType] = builder;

  return builder;
}

function set(newErrorType, existingErrorType) {
  if (HAS.call(ErrorBuilders, newErrorType))
    throw new Error('cannot override the existing <'+
      newErrorType+'> with <'+existingErrorType);
  if (!HAS.call(ErrorBuilders, existingErrorType))
    throw new Error('error is not defined: <'+existingErrorType+'>');
  
  var builder = ErrorBuilders[existingErrorType];
  ErrorBuilders[newErrorType] = builder;

  return builder;
}

// TODO: the argument that is coming last is a sample error code; builders must have this value as a property.
// also a list of options may come after each of these "samples" signifying which options they should be parsed with
a('arrow.paren.no.arrow',
  { tn: 'parser.unsatisfiedArg', m: 'Unexpected token: ...' },
  '(a,...b)');

a('assignable.unsatisfied',
  { tn: 'parser.unsatisfiedAssignment', m: 'Shorthand assignments can not be left unassigned' },
  '[{a=b}]');

a('assig.not.first',
  { c0: 'parser.c',
    li0: 'parser.li',
    col0: 'parser.col',
    m: 'Assignment left hand side not valid',
    p: function() { this.c0 -= 1; this.col0 -= 1; }
  },
  'a*b=12');

a('assig.not.simple',
  { tn: 'tn',
    m: 'Identifiers along with member expressions are the only valid targets for non-simple assignments; {tn.type} is neither an identifier nor a member expression' });

a('assig.to.eval.or.arguments',
  { tn: 'tn',
    m: '{tn.name} cannot be modified in the current context' },
  '"use strict"; [eval, arguments=12]=l');

a('binding.rest.arg.not.id',
  { tn:'tn',
    m: 'a function\'s rest parameter can only have an identifier as its argument; in this case, it is a {tn.argument.type}' },
  '(a, ...[b])=>12', '(function (e, ...{l}) {})');

a('block.unfinished',
  { c0: 'parser.c0', li0: 'parser.li0', col0: 'parser.col0',
    m: 'the block starting at {tn.loc.start.line}:{tn.loc.start.column} is unfinished; got a token of type {parser.lttype} instead of a closing "}"' }, '{ )');

set('block.dependent.is.unfinished', 'block.unfinished');

// TODO: locations
a('block.dependent.no.opening.curly',
  { c0: 'parser.c0', li0: 'parser.li0', col0: 'parser.col0',
    m: 'curly brace was expected after this {extra.blockOwner}; instead, got a token with type {parser.lttype}' },
  'try (', 'try {} catch (e) return');

