This is a tool to integrate tooling from NPM packages.

It is optimistically incomplete.  Don't bother looking at it yet, can't do you a damned thing..


Simple goals will be 

* install globally (or not) npm run fret should work within a package the same way as the global cli installation would.

* support the fret key in the package.json file for creating fret capable modules

* there will be a router so you can do things like: fret angularjs generate "x"

* meta commands will be prefixed with ~  so fret ~configure may be a thing, and do the stuff it should do.

* workspace pub-sub, this strange idea I had to be able to sent a "signal" to my workspace fret ~signal "message" {"data": "stuff"} that can be handled
a good example would be: fret ~signal modified {"files": ["src/index.js"]} this could be tied to a watcher, OR your editor to provide a more uniform interface to "when" something happens.

