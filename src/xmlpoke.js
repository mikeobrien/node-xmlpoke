"use strict";

var paths = require('./paths'),
    Args = require('./args'),
    Document = require('./document'),
    _ = require('lodash');

module.exports = function() {
    var args = Args(arguments);
    var modify = args.last();

    if (_.startsWith(_.trim(args.first()), '<'))
    {
        var document = Document.load(args.first());
        modify(document, {});
        return document.toString();
    }
    else
    {
        var files = args.applyLeading(paths.expand);

        files.forEach(function(file) {
            var document = Document.open(file.path);
            modify(document, file.context);
            document.save();
        });
    }
};

module.exports.XmlString = Document.XmlString;
module.exports.CDataValue = Document.CDataValue;