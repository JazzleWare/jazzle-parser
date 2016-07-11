/* eslint-env mocha */

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

var Parser = require(path.join(__dirname, '../src'));
var tests = {};

function runTests(dir) {
  var files = fs.readdirSync(dir);

  files.forEach(function(file) {
    file = path.join(dir, file);
    var stat = fs.statSync(file);

    if (stat.isDirectory()) {
      runTests(file);
    } else {
      var id = file.replace(/\..+$/, '');
      if (!tests[id]) tests[id] = {};
      if (/\.js$/.test(file)) {
        tests[id].src = file;
      } else {
        tests[id].res = file;
      }
    }
  });
}

var testRoot = path.resolve(__dirname, 'tests/test');

runTests(testRoot);

describe('jsRube', function() {
  Object.keys(tests).forEach(function(id) {
    var name = path.relative(__dirname, id);

    it(name, function() {
      var src = fs.readFileSync(tests[id].src, 'utf-8');
      var res = JSON.parse(fs.readFileSync(tests[id].res, 'utf-8'));

      /* eslint-disable */
      if (process.env.LOG) {
        console.log(  '----------|     SOURCE     |----------\n');
        console.log(src);
        console.log('\n----------| GENERATED TREE |----------\n');
        console.log(new Parser(src).parseProgram());
        console.log('\n----------| EXPECTED  TREE |----------\n');
        console.log(res);
        console.log('\n----------|       END      |----------'  );
      }
      /* eslint-enable */

      expect(new Parser(src).parseProgram()).to.be.eql(res);
    });
  });
});
