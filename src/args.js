"use strict";

var _ = require('lodash');

module.exports = function (args) {
    args = _.toArray(args);
    return {
        first: function() { return _.first(args); },
        last: function() { return _.last(args); },
        applyLeading: function(func) { 
            return args.length < 2 ? func() :
                func.apply(null, args.splice(0, args.length - 1));
        },
        toObject: function() { 
            if (args.length > 1 && _.isString(args[0])) {
                var object = {};
                object[args[0]] = args[1];
                return object;
            }
            else if (args.length == 1 && _.isObject(args[0])) return args[0];
            return {};
        }
    };
};
