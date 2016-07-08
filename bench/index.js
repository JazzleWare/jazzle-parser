var fs = require('fs');
var path = require('path')

var Benchmark = require('benchmark');

var lube = require('../dist/lube.js');
var SOURCES_ROOT = path.join(__dirname, 'sources');
var parsers = {};
var sources = {};

try {
   var esprima = require('esprima');
   parsers.esprima = function(src, withLoc) {
      return esprima.parse(src, { loc: withLoc, ranges: withLoc });
   }
} catch (err) {
   parsers.esprima = false;
}

try {
   var acorn = require('acorn');
   parsers.acorn = function(src, withLoc) {
      return acorn.parse(src, { locations: withLoc });
   }
}
catch (err) {
   parsers.acorn = false;
}

parsers.lube = function(src, withLoc) {
   return new lube.Parser(src).parseProgram();
}

console.log('Loading sources in memory..');

fs.readdirSync(SOURCES_ROOT).forEach(function (source) {
   var file = path.join(SOURCES_ROOT, source);

   if (!fs.statSync(file).isFile()) throw new Error('Source ' + file + ' is not a file!');

   sources[source] = fs.readFileSync(file, 'utf-8');
});

console.log('Starting benchmarks..');


function parseLater(parser, source) {
   return function () {
      return parsers[parser](sources[source], !false);
   }
}

var results = {};

Object.keys(parsers).forEach(function (parser) {
   if (!parsers[parser]) {
      console.log('  ' + parser + '... not found (skipped)');
      return;
   }

   var suite = new Benchmark.Suite;
   process.stdout.write('  ' + parser + '... ');

   Object.keys(sources).forEach(function (source) {
      suite.add(source, parseLater(parser, source));
   });

   suite.on('cycle', function (event) {
      if (!results[parser]) results[parser] = {};

      results[parser][event.target.name] = { // event.name === source name
         speed: event.target.hz, // ops/sec
         range: event.target.stats.rme, // +/-
         times: event.target.stats.sample.length // how many runs
      };
   });

   suite.on('complete', function () {
      console.log('done!');
   })

   suite.run();
});

// Now the results variable contains the result of our bench, and can be
// processed as you prefer. You could even use chalk for prettier output
// or/and pipe it to a file.

/* Example output

+----------------------------------------+
|             PARSER   NAME              |
+----------------------------------------+
| filename |     ops/sec     |    runs   |
+----------+-----------------+-----------+
|  file 1  |  0000hz + 00%   |     00    |
|  file 2  |  0000hz + 00%   |     00    |
|  file 3  |  0000hz + 00%   |     00    |
+----------+-----------------+-----------+

// */

var output = {};

var sourcesLenght = Object.keys(sources).reduce(function (pre, cur) {
   return Math.max(pre, cur.length);
}, 'filename'.length);
var opsLength = '0000.00 +00.00%'.length;
var runsLength = 'runs'.length;
var totWidth = sourcesLenght + opsLength + runsLength + 6;
var banner = '+' + Array(totWidth + 3).join('-') + '+';

function pad(src, length, align, fill) {
   length -= src.length;
   if (length <= 0) return src;

   if (align === 'l') {
      return src + Array(length + 1).join(fill);
   } else if (align === 'r') {
      return Array(length + 1).join(fill) + src;
   } else {
      return Array(~~(length / 2 + 0.5) + 1).join(fill) + src + Array(~~(length / 2) + 1).join(fill);
   }
}

Object.keys(parsers).forEach(function (parser) {
   if (!parsers[parser]) return;

   console.log(banner);
   console.log('| %s |',
      pad(parser, totWidth, 'c', ' ')
   );
   console.log(banner);
   console.log(
      '| %s | %s | %s |',
      pad('filename', sourcesLenght, 'c', ' '),
      pad('ops/sec', opsLength, 'c', ' '),
      pad('runs', runsLength, 'c', ' ')
   );
   console.log(banner);

   Object.keys(sources).forEach(function (source) {
      var ops = pad(results[parser][source].speed.toFixed(2), 7, 'r', ' ') +
         ' ' + pad('\xb1' + results[parser][source].range.toFixed(2) + '%',
         7, 'r', ' ');
      console.log(
         '| %s | %s | %s |',
         pad(source, sourcesLenght, 'c', ' '),
         ops,
         pad(results[parser][source].times.toString(), runsLength, 'c', ' ')
      );
   });

   console.log(banner);
});

//console.log(results);
