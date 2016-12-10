this.err = function(errorType, errParams) {
   if ( has.call(this.errorHandlers, errorType) )
     return this.handleError(this.errorHandlers[errorType], errParams);

   var message = "";
   if (!HAS.call(ErrorBuilders, errorType))
     message = "Error: " + errorType + "\n" +
       this.src.substr(this.c-120,120) +
       ">>>>" + this.src.charAt(this.c+1) + "<<<<" +
       this.src.substr(this.c, 120);

   else {
     errParams = this.normalize(errParams);
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
  
this.handleError = function(handlerFunction, errorTok, args ) {
   var output = handlerFunction.call( this, params, coords );
   if ( output ) {
     this.errorHandlerOutput = output;
     return true;
   }

   return false;
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

// TODO: choose a more descriptive name
var NORMALIZE_COMMON = ['li0', 'c0', 'col0', 'li', 'c', 'col'];

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

