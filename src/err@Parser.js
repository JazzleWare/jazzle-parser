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
     var errorBuilder = ErrorBuilders[errorType];
     var messageBuilder = errorBuilder.m;
     var offsetBuilder = errorBuilder.o;
     var locBuilder = errorBuilder.l;
   
     message += "Error: ";

     // TODO: add a way to print a 'pinpoint', i.e., the particular chunk of the
     // source code that is causing the error
     message += buildLoc(locBuilder, errParams)+"(src@";
     message += buildOffset(offsetBuilder, errParams)+"): ";
     message += buildMessage(messageBuilder, errParams);
   }

   throw new Error(message);
};
  
this.handleError = function(handlerFunction, errorTok, args ) {
   var output = handlerFunction.call( this, params, coords );
   if ( output ) {
     this.errorHandlerOutput = output;
     return !false;
   }

   return false;
};

