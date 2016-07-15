var util = require( './util.js' );

function compare(expected, actual, name ) {
    if ( typeof actual !== typeof expected ) 
      return { type: 'incompatible-types', actual: actual, expected: expected };
  
    if ( actual instanceof RegExp ) {
      if (!( expected instanceof RegExp ))
         return { type: 'incompatible-types', actual: actual, expected: expected };
  
      actual = actual.toString();
      expected = expected.toString();
    } 
  
    switch ( typeof actual ) {
       case util.types.STRING:
         if ( actual !== expected )
           return { type: 'not-equal', actual: actual + "(" + util.  toBytes(actual) + ")",
                                     expected: expected + "(" + util.toBytes(expected) + ")" };
       case util.types.BOOL:
       case util.types.NUMBER:
         if ( actual !== expected ) 
           return { type: 'not-equal', actual: actual, expected: expected + "(" + util.toBytes(expected) + ")" };
   
         return null;
    }
  
    if ( actual === null ) {
      if ( expected !== null )
        return { type: 'not-equal', actual: actual, expected: expected };
  
      return null;
    }

    return compareObj(expected, actual, name ) ;
   
    if ( actual.length >= 0 ) {
       if ( !(expected.length >= 0) )
         return { type: 'incompatible-types', actual: actual, expected: expected };
  
       return compareArray(expected,actual,name );
    }
 
}
module.exports .compare = compare;          

function compareArray(expected, actual, name ) {
    var comp = null, i=0;
    while ( i < expected.length ) {
       var l = null;
       if ( i < actual.length ) {
          l = compare(expected[i], actual[i], i );
       }
       else {
          l = { type: 'not-in-the-actual', val: expected[i] };
       }
  
       if ( l ) {
          if ( !comp ) comp = {};
          comp[i] = l;
       }
       i = i + 1;
    }
    
    if ( i < actual.length ) {
      if ( !comp ) comp = {};
      do {
        comp[i] = { type: 'not-in-the-expected', val: actual[i] };
        i = i + 1 ;
      } while (i < actual.length) ;
  
    }
  
    return comp;
}
 module.exports.compareArray = compareArray;  

function has(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop) ; }
function assert(cond, message) {
   if ( !cond ) throw new Error( "Error: " + message );

}

function adjust (esprimaNode, jsrubeNode, name ) {

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

function compareObj(expected, actual, name ) {

    adjust(expected, actual, name);
    var comp = null, item;
    for ( item in expected ) {
        if ( !util.has(expected, item) ) continue;
        var l = null;
        if ( util.has(actual, item) )
           l = compare(expected[item], actual[item], item ) ;
        else
           l = { type: 'not-in-the-actual', val: expected[item]   }  ;
   
        if ( l ) {
           if ( !comp ) comp = {};
           comp[item] = l;
        }
    }
  
    for ( item in actual ) {
        if ( !util.has(actual, item) ||
              util.has(expected, item) ) continue ;

        var l = null;
        if ( !comp ) comp = {} ;
        comp[item] = { type: 'not-in-the-expected', val: actual[item] } ;
    }
  
    return comp;
}

 module.exports.compareObj = compareObj;  

