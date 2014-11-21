"use strict";

var fs = require('fs'),
    glob = require('glob'),
    _ = require('lodash');

function expand() {

    var paths = _.chain(arguments).toArray().flatten().value();
    var getPath = _.chain(paths).last().isFunction().value() ? 
        paths.pop() : function(x) { return x.path; };

    if (!_.any(paths)) throw Error('No paths specified!');

    return _.chain(paths)
        .map(function(x) { 
            var string = _.isString(x);
            return { 
                id: string ? 0 : _.uniqueId(),
                paths: glob.sync(string ? x : getPath(x), { nodir: true }), 
                context: string ? {} : x }; 
            })
        .map(function(x) { 
            return x.paths.map(function(path) { 
                return { id: x.id, path: path, context: x.context }; })
            })
        .flatten()
        .uniq(function(x) { return x.id + ':' + x.path; })
        .value();
}

module.exports = {
    expand: expand
};