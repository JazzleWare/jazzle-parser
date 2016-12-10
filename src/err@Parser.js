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

  return errInfo;
};

var ErrorBuilders = {};
function a(errorType, builderOutline) {
  if (HAS.call(ErrorBuilders, errorType))
    throw new Error('Error type has already got a builder: <'+errorType+'>');
  var builder = {};
  for (var name in builderOutline) {
    if (name === 'm')
      builder.messageTemplate = ErrorString.from(builderOutline[name]);
    else
      builder[name] = Template.from(builderOutline[name]);
  }

  ErrorBuilders[errorType] = builder;
}

a('arrow.paren.no.arrow', { tn: 'parser.unsatisfiedArg', m: 'Unexpected token: ...' });
 
