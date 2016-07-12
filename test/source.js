/* eslint-env mocha */
/* eslint no-console: 0 */

var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

var tests = {};

function setTest(dir, field, value) {
  var steps = dir.replace(/^\//, '').replace(/\/$/, '').split(/\//);
  var walker = tests;

  steps.forEach(function(step) {
    if (!walker[step]) walker[step] = {};
    walker = walker[step];
  });

  if (walker[field]) {
    console.error('> ' + dir + ' > Rewrite ' + field + '\nOriginal: ' + walker[field] + '\nNew: ' + value);
  //  throw new Error('Field "' + field + '" already exists for test "' + dir + '"');
  }

  walker[field] = value;
  if (!walker.runnable) walker.runnable = true;
}

function genTestTree(dir, base) {
  if (!base || base == null) base = dir;
  var files = fs.readdirSync(dir);

  files.forEach(function(file) {
    file = path.join(dir, file);
    var stat = fs.statSync(file);

    if (stat.isDirectory()) {
      genTestTree(file, base);
    } else {
      var id = path.relative(base, file.replace(/\..+$/, ''));
      setTest(id, /\.js$/.test(file) ? 'src' : 'res', file);
    }
  });
}

function runTests(tree, parse) {
  Object.keys(tree).forEach(function(branch) {
    if (tree[branch] && tree[branch].runnable) {
      // run the test
      it(branch, function() {
        var src = fs.readFileSync(tree[branch].src, 'utf-8');
        var res = JSON.parse(fs.readFileSync(tree[branch].res, 'utf-8'));
        var AST = parse(src);

        expect(AST).to.be.eql(res);
      });
    } else {
      // recurse into subtree
      describe(branch, function() {
        runTests(tree[branch], parse);
      });
    }
  });
}

genTestTree(path.resolve(__dirname, 'tests/test'));

describe('jsRube (source)', function() {
  var Parser = require(path.join(__dirname, '../src'));

  runTests(tests, function(source) {
    // TODO: hook adjuster "midleware"
    return new Parser(source).parseProgram();
  });
});
