var which = require("which");
var path = require("path");
var Q = require("q");
var _ = require("lodash");
Q.longStackSupport = true;

var jf = require('jsonfile')
var findup = require('findup-sync');
var glob = Q.denodeify(require("glob"));


var readJSONfile = Q.denodeify(jf.readFile);

var exports = {
	globalPath: null,   // Global install directory
	localPath: null		//  local install directory
};

//NOTE: Not sure if this is the "correct way" to create default responses in Q, but it FEELS right, meh...  /*1*/
function Constant(value) {
	return Q.Promise(function(resolve) {
		resolve(value);
	})
}


function getAttr(key) { // TODO throw exception? (or something) when unloaded
	return exports[key];
}


function listAllModules() {
	var globalResult = Constant([]); /*1*/
	var localResult = Constant([]); /*1*/

	if (getAttr('globalPath')) {
		globalResult = glob("*", {realpath: true,  cwd: getAttr("globalPath")});
	}

	if (getAttr("localPath")) {
		localResult = glob("*", {realpath: true, cwd: getAttr("localPath")});
	}

	return Q.Promise(function(resolve, reject) {
		Q.all([globalResult, localResult]).then(function(files) {
			var result = {global: files[0], local: files[1]};
			resolve(result);
		}, function(err) {
			reject(err);
		});
	});	
}
exports.listAllModules = listAllModules;


function loadPackageJSON(filename) {
	return readJSONfile(filename);
}


function parsePackageForModule(modulePaths, packages) {
	var result = {};
	if (modulesPaths.length != packages.length) {
		reject("for unknown reasons things went wrong");
	}

	for (var i = 0; i < packages.length; i++) {
		var _package = packages[i];

		if ((_package.state == 'fulfilled') && (_package.value.fret)) {
			localModules[modules.local[i]] = localPackage;
		}
	}
}

function settledValues(results) {
	var filtered = new Array(results.length);
	for (var i = 0; i < results.length; i++) {
		filtered[i] = null;
		if (results[i].state == 'fulfilled') {
			filtered[i] = results[i].value;
		}
	}

	return filtered;
}

function settledErrors(results) {
	var filtered = new Array(results.length);
	for (var i = 0; i < results.length; i++) {
		filtered[i] = null;
		if (results[i].state != 'fulfilled') {
			filtered[i] = results[i];
		}
	}

	return filtered;
}

function showPackageErrors(packageList) {
	_.each(packageList, function(value, key) {
		if (value) {
			console.log("Error parsing package.json: (",key,") ->", value.reason);
		}
	});
}

function fretOnlyPackages(packageList) {
	return _.reduce(packageList, function(acc, value, key) {
		if (value && value.fret) {
			acc[key] = value;
		}
		return acc;
	}, {});
}

function loadAllModules(modules) {
	return Q.spread([
		Q.allSettled(
			modules.local.map(function(x) {
				return path.join(x, 'package.json');
			}).map(loadPackageJSON)),
		Q.allSettled(modules.global.map(function(x) {
				return path.join(x, 'package.json');
			}).map(loadPackageJSON)),
	], function(localPackages, globalPackages) {
		return Q.Promise(function(resolve, reject) {
			showPackageErrors(_.zipObject(modules.local, settledErrors(localPackages)));
			showPackageErrors(_.zipObject(modules.global, settledErrors(globalPackages)));

			var fretLocalPackages = _.zipObject(modules.local, settledValues(localPackages));
			var fretGlobalPackages = _.zipObject(modules.global, settledValues(globalPackages));

			fretLocalPackages = fretOnlyPackages(fretLocalPackages);
			fretGlobalPackages = fretOnlyPackages(fretGlobalPackages);

			resolve({"local": fretLocalPackages, "global": fretGlobalPackages});
		});
	});
}
exports.loadAllModules = loadAllModules;


function mapFretRoutes() {
	return Q.Promise(function(resolve, reject) {

	});
}

function resolveLocalPath() {
	return Constant(findup('node_modules'));
}
exports.resolveLocalPath = resolveLocalPath;


function resolveWorkspacePath() {
	return Constant(findup('fret_tools'));
}
exports.resolveLocalPath = resolveLocalPath;


function resolveGlobalPath() {
	return Q.Promise(function(resolve, reject) {
		which(process.argv[0], function (er, node) {
			if (er || (node.toUpperCase() !== process.execPath.toUpperCase())) {
				reject(null);
			}
			resolve(path.join(path.resolve(node, "..", ".."), "lib", "node_modules"));
		});
	});		
}
exports.resolveGlobalPath = resolveGlobalPath;


function resolvePaths() {
	return Q
		.all([resolveLocalPath(), resolveGlobalPath()])
		.then(function(results) {
			return {localPath: results[0], globalPath: results[1]};
		}, function(err) {
			console.log(err);
		});
}
exports.resolvePaths = resolvePaths;


function execute(argv) {
	resolvePaths()
		.then(function(paths) {
			exports.localPath = paths.localPath;
			exports.globalPath = paths.globalPath;
						//return null; NOTE: wait, what's the protocol here???  is it guaranteed that this function executes before ListAllModules??? (spec won't change in the future?)
		})
		.then(listAllModules)
		.then(loadAllModules)
		.then(function(modules){
			exports.fretModules = modules;

			return Q.Promise(function(resolve) {
				resolve(modules);
			})
		})
		.then(mapFretRoutes)
		.then(function() {
			//console.log(arguments);
		}, function(err) {
			console.log(err);
		});
}
exports.execute = execute;


module.exports = exports;