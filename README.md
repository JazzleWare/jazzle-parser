# jsRube
A small, simple, and ridiculously fast parser for all versions of ECMAScript/Javascript, written in plain ECMAScript3, on which I have been working on and [off](https://github.com/nodejs/node/issues/5900) since September 2015, under codename 'lube'.

A bug in v8 (and consequently in node) made it very difficult to run on node versions 5 and below. The bug has been resolved, and it now runs smoothly (and fater than any other parser I know of) in node v6.2.0+. Please bear this notice in mind while trying to use this parser. 

#Features
It always records the location data, range data, and raw value of every node, and still it parses jQuery-1.4.2 2x or 3.5x faster than esprima 2.7.2, depending, respectively, on whether the latter doesn't record the location/ranges or it does.
Funnily enough, it does all the above while keeping track of as much early errors as I could find in the spec.

It is almost completely esprima-compatible (except when things get annoying, in which case it is acorn-compatible). It is also going to have a full coverage by July 12th 2016 (that is, this weekend), ruthlessly vampiring on esprima's tests.

#Future
My take is that, awesome as the parser is, it can still be more robust, and more low-power; even if it hits limits in the previous criteria, I'm still aiming to make it catch all of the spec's early errors, and i am intending to make it so in a matter of weeks, i.e, not even months.

#Usage
First,
``sh
npm install jsrube
``

Then:

```javascript
var jsRube = require( 'jsrube' );
console.log( jsRube.parse('var v = "hi !";') );
```


#Testing

```sh
npm test jsrube
```

#anything else
Thanks a lot reading this far.

