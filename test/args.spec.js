"use strict";

var expect = require('chai').expect,
    cases = require('cases'),
    Args = require('../src/args'),
    _ = require('lodash');

function args() { return arguments; }

describe('args', function() {

    describe('last', function() {

        it('should return last arg', cases([
          [ args(), undefined ],
          [ args('a'), 'a' ],
          [ args('a', 'b'), 'b' ]
        ], function (args, expected) {
            expect(Args(args).last()).to.equal(expected);
        }));
     
    });

    describe('leading', function() {

        it('should apply leading args', cases([
          [ args(), [ undefined, undefined ] ],
          [ args('a'), [ undefined, undefined ] ],
          [ args('a', 'b'), ['a', undefined] ],
          [ args('a', 'b', 'c'), ['a', 'b'] ]
        ], function (args, expected) {
            expect(Args(args).applyLeading(
                function (a, b) { return [a, b]; }))
                    .to.deep.equal(expected);
        }));
     
    });

    describe('toObject', function() {

        it('should convert to object', cases([
          [ args('key', 'value'), { key: 'value' } ],
          [ args('key', 'value1', 'value2'), { key: 'value1' } ],
          [ args({ key: 'value' }), { key: 'value' } ],
          [ args(1), {} ]
        ], function (args, expected) {
            expect(Args(args).toObject()).to.deep.equal(expected);
        }));
     
    });

});
