var PASS_MODE = 0, FAIL_MODE = 1;

function JazzleTest(testJS) {
  this.testURI = testJS;
  this.testMode = -1;
  this.src = "";
  this.testJSON = null;
  this.compError = null;
  this.rawSource = "";
  this.error = null;
  this.parser = null;
}

JazzleTest.prototype.runWith = function(Parser) {
   var parser = this.parser = new Parser(this.src, this.isModuleTest());
   console.log("isModule:", !parser.isScript, "testconfig:", this.jsonType);

   var result = null;
   try {
     result = parser.parseProgram(); 
   }
   catch (e) {
     result = this.error = e;
   }
   this.compError = util.compare(this.testJSON, result);
   return this.isExpected();
};

var util = require('./util.js');
JazzleTest.prototype.isExpected = function(result) {
   return this.compError === null;
};

JazzleTest.prototype.isModuleTest = function() {
   switch ('module') { 
   case this.jsonType:
   case this.testJSON.sourceType:
   case this.jsType:
     return true;
   default:
     return false;
  
   } 
};

function JazzleTestSuite(Parser) {
   this.Parser = Parser;
   this.mustFail = 0;
   this.mustFailAndFailed = 0;
   this.mustFailButSkipped = 0;
   this.mustFailAndFailedButIncompatible = 0;
   this.mustPass = 0;
   this.mustPassAndPassed = 0;
   this.mustPassButSkipped = 0;
   this.mustPassAndPassedButIncompatible = 0;
   this.excludeList = [];
   this.excludeCoverage = {};
   this.testListeners = null;
}

var STR_TYPE = typeof "", FUNC_TYPE = typeof function(){};

JazzleTestSuite.prototype.loadJSON = function(test, jsonType) {
   try { 
      test.testJSON = util.readJSON(test.name+'.'+jsonType+'.json');
      test.jsonType = jsonType;
      return test.testJSON;
   }
   catch (e) { return null; }
};

var fs = require('fs');
function readFile(filePath) { return fs.readFileSync(filePath, 'utf-8'); }

JazzleTestSuite.prototype.loadSource = function(test) {
   if (test.testMode !== -1) return;
   test.rawSource = readFile(test.testURI);
   var sufidx = util.tailIndex(test.testURI, '.source.js');
   test.jsType = 'script';
   if (util.tailIndex(test.testURI, '.module.js') !== -1)
     test.jsType = 'module';

   if (sufidx !== -1) {
     test.src = eval("(function(){"+test.rawSource+"; return source;})()");
   }
   else {
     test.src = test.rawSource;
     sufidx = util.tailIndex(test.testURI, '.js');
   }
   test.name = test.testURI.substr(0, sufidx);

   if (this.loadJSON(test, 'failure')) test.testMode = FAIL_MODE;
   else {
     if (!this.loadJSON(test, 'tokens') &&
         !this.loadJSON(test, 'module') && 
         !this.loadJSON(test, 'tree'))
          throw new Error("Test <"+test.testURI+"> has no associated json file");
    
     test.testMode = test.testJSON.lineNumber ? FAIL_MODE : PASS_MODE;
   }
};
 
JazzleTestSuite.prototype.exclude = function(tester, name) {
   var list = this.excludeList, e = 0;
   while (e < list.length)
      if (tester === list[e++])
        return;

   var elem = { tester: tester, name: name || null, coverage: null };
   name = elem.name === null ? '<no-name>' : elem.name + '%';
   elem.coverage = this.excludeCoverage[name] || (this.excludeCoverage[name] = [0]); 
   list.push(elem);
};
 
JazzleTestSuite.prototype.push = function(test) {
   this.loadSource(test);
   var state = 'unknown';
   if (test.testMode === PASS_MODE) {
      this.mustPass++;
      if (this.skip(test)) {
        state = 'skipped-pass';
        this.mustPassButSkipped++;
      }
      else if (test.runWith(this.Parser)) {
        state = 'pass-as-expected';
        this.mustPassAndPassed++;
      }
      else if (test.error !== null) state = 'unexpected-fail';
      else {
         state = 'incompatible-pass';
         this.mustPassAndPassed++;
         this.mustPassAndPassedButIncompatible++;
      }
   }
   else {
      this.mustFail++;
      if (this.skip(test)) { state = 'skip-fail'; this.mustFailButSkipped++; }
      else if (test.runWith(this.Parser)) { state = 'fail-as-expected'; this.mustFailAndFailed++; }
      else if (test.error === null) state = 'unexpected-pass';
      else {
        state = 'incompatible-fail';
        this.mustFailAndFailed++;
        this.mustFailAndFailedButIncompatible++;
      }
   }

   if (this.testListener)
     this.testListener(test, state);

   return state;
};

JazzleTestSuite.prototype.skip = function(test) {
   var list = this.excludeList, e = 0;
   while (e < list.length) {
      var elem = list[e], tester = elem.tester;
      if ( (typeof tester === STR_TYPE && test.testURI === tester) ||
           (tester instanceof RegExp && test.testURI.match(tester)) ||
           (typeof tester === FUNC_TYPE && tester(test)) ) {
        elem.coverage[0]++;
        return true;
      }

      e++;
   }
   return false;
};

JazzleTestSuite.prototype.summary = function() {
   return { 
       total: this.mustPass + this.mustFail,
       asExpected: this.mustPassAndPassed + this.mustFailAndFailed,
       skip: this.mustPassButSkipped + this.mustFailButSkipped,
       pass: this.mustPass, passAsExpected: this.mustPassAndPassed, skipPass: this.mustPassButSkipped,
       incompatiblePass: this.mustPassAndPassedButIncompatible,
       fail: this.mustFail, failAsExpected: this.mustFailAndFailed, skipFail: this.mustFailButSkipped,
       incompatibleFail: this.mustFailAndFailedButIncompatible
   };
};

JazzleTestSuite.prototype.str = function() {
   var s = this.summary(), str = "";
   str += "PASS MODE: " + s.pass + "(" +
          (s.skipPass) + " skipped; remaining: " +
          (s.pass - s.skipPass ) + "); " +
          (s.passAsExpected) + "/" + (s.pass-s.skipPass) + " as expected (" + s.incompatiblePass + " incompatible.)";
   str += "\n";
   str += "FAIL MODE: " + s.fail + "(" +
          (s.skipFail) + " skipped; remaining: " +
          (s.fail - s.skipFail ) + "); " +
          (s.failAsExpected) + "/" + (s.fail-s.skipFail) + " as expected (" + s.incompatibleFail + " incompatible.)";
   str += "\n\nSKIP STATS:\ncoverage\tname\n--------\t----\n";
   var list = this.excludeList, e = 0;
   while (e < list.length) {
      var elem = list[e];
      var name = elem.name === null ? '<no-name>' : elem.name + '%';
      if (this.excludeCoverage[name] !== null) {
         str += elem.coverage[0] + '\t\t' + (elem.name === null ? '<no-name>' : elem.name) + '\n';
         this.excludeCoverage[name] = null;
      }
      e++;
   }
 
   str += "\n====================\n";
   str += "TOTAL:\t" + s.total + "(" +
          (s.skip) + " skipped; remaining: " +
          (s.total - s.skip) + "); " +
          (s.asExpected) + "/" + (s.total-s.skip) + " as expected.";

   return str;
};

 module.exports.JazzleTest = JazzleTest;
 module.exports.JazzleTestSuite = JazzleTestSuite;
