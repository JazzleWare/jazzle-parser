this.err = function(errorType, errParams) {
  return this.errorListener.onErr(errorType, errParams);
};
