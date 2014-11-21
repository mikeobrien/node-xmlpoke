"use strict";

var paths = require('./paths'),
    Document = require('./document'),
    _ = require('lodash');

module.exports = function() {
    var args = _.toArray(arguments);
    var modify = args.pop();
    var files = paths.expand.apply(null, args);

    files.forEach(function(file) {
        var document = Document.open(file.path);
        modify(document, file.context);
        document.save();
    });
};