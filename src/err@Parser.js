this.err = function(errorType, errorTok, args) {
   if ( has.call(this.errorHandlers, errorType) )
     return this.handleError(this.errorHandlers[errorType], errorTok, args );

   throw new CustomError( createMessage( Errors[errorType], errorTok, args ) );
};


function CustomError(start,li,col,message) {
   this.atChar = start;
   this.atLine = li;
   this.atCol = col;
   this.message = message;

}

CustomError.prototype = Error.prototype;

function createMessage( errorMessage, errorTok, args  ) {
  return errorMessage.replace( /%\{([^\}]*)\}/g,
  function(matchedString, name, matchIndex, wholeString) {
     if ( name.length === 0 )
       throw new Error( "placeholder empty on " + matchIndex + " for [" + errorMessage + "]" );

     if ( !has.call(args, name) )
       throw new Error( "[" + name + "] not found in params " );
     
     return args[name] + "" ;
  }) ;

}
   
this.handleError = function(handlerFunction, errorTok, args ) {
   var output = handlerFunction.call( this, params, coords );
   if ( output ) {
     this.errorHandlerOutput = output;
     return !false;
   }

   return false;
};

