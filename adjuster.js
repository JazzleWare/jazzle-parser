
function has(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop) ; }
function assert(cond, message) {
   if ( !cond ) throw new Error( "Error: " + message );

}

 module.exports.convertEsprimaToJSRube = function(esprimaNode, jsrubeNode, name ) {

    if ( has( esprimaNode, 'tokens' ) ) delete esprimaNode.tokens;
    if ( has( esprimaNode, 'source' ) ) delete esprimaNode.source;
    if ( has( esprimaNode, 'raw' ) ) delete esprimaNode.raw;
    if ( has( esprimaNode, 'directive' ) ) delete esprimaNode.directive;
    if ( has( esprimaNode, 'errors' ) ) delete esprimaNode.errors;
    if ( has( esprimaNode, 'comments' ) ) delete esprimaNode.comments ;

    if ( jsrubeNode.regex ) {
       delete jsrubeNode.value;
       assert( esprimaNode.regex ); delete esprimaNode.value;
    }

    if ( !esprimaNode.loc ) delete jsrubeNode.loc;
    if ( !esprimaNode.range ) delete jsrubeNode.range;
         
    if ( name !== "loc" && has( jsrubeNode, 'start' ) ) {
      if ( esprimaNode.range )  jsrubeNode.range = [jsrubeNode.start, jsrubeNode.end];
      delete jsrubeNode.start;
      delete jsrubeNode.end;
    }
    if ( has( jsrubeNode, 'p' ) ) {
      delete jsrubeNode.p;  
    }
    if ( has( jsrubeNode, 'raw' ) ) delete jsrubeNode.raw ; 
    if ( jsrubeNode.type === 'AssignmentProperty' )
         jsrubeNode.type = 'Property';

    if ( name === 'params' ) {
      var i = 0;
      while ( i < jsrubeNode.length ) {
         if ( jsrubeNode[i].type === 'AssignmentPattern' && i < esprimaNode.length &&
              jsrubeNode[i].type !== esprimaNode[i].type ) {
              jsrubeNode[i] = jsrubeNode[i].left;
         }
         i++ ; 
      
      }
    }      

    if ( esprimaNode.type === 'ForInStatement' && has(esprimaNode, 'each' ) )
      delete esprimaNode.each;

    if ( jsrubeNode.type === 'TemplateLiteral' ) {
      var list = jsrubeNode.quasis, i = 0;
      while ( i < list.length ) {
         list[i].start -= 1;
         list[i].end += i === list.length - 1 ? 1 : 2;
         list[i].loc.start.column -= 1;
         list[i].loc.end.column += i === list.length - 1 ? 1 : 2;
         i++ ; 
      }
    }

    if ( esprimaNode .type === 'AssignmentPattern'  ) {
         if ( esprimaNode.operator && !jsrubeNode.operator ) jsrubeNode.operator = '=';

    }
    
    if ( ( esprimaNode.type === 'ExportNamedDeclaration' || 
           esprimaNode.type === 'ImportDeclaration' ||
           esprimaNode.type === 'ExportAllDeclaration' ) && !has(esprimaNode, 'source' ) )
      delete jsrubeNode.source;

    if ( ( esprimaNode.type === 'FunctionExpression' || esprimaNode.type === 'FunctionDeclaration' ) ) delete esprimaNode.defaults;

    if ( esprimaNode.type === 'TryStatement' ) {
      delete esprimaNode.handlers; delete esprimaNode.guardedHandlers;
  
    }
}

