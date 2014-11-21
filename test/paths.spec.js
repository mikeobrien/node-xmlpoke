"use strict";

var fs = require('fs'),
    path = require('path'),
    touch = require('touch'),
    expect = require('chai').expect,
    temp = require('temp').track(),
    cases = require('cases'),
    paths = require('../src/paths'),
    _ = require('lodash');

describe('paths', function() {

    describe('expand', function() {

        var basePath, relative, absolute;

        before(function() {

            basePath = temp.mkdirSync();

            touch.sync(path.join(basePath, 'a.xml'));
            touch.sync(path.join(basePath, 'b.xml'));
            fs.mkdirSync(path.join(basePath, 'dir'));
            touch.sync(path.join(basePath, 'dir', 'a.xml'));
            touch.sync(path.join(basePath, 'dir', 'b.xml'));

            relative = function(file) {
                return path.relative(basePath, file.path);
            }

            absolute = function() {
                return path.join.apply(null, [ basePath ].concat(_.toArray(arguments)));
            }
        });

        after(function() {
            temp.cleanupSync();
        });

        it('should resolve files', function() {

             cases([
                [[ absolute('a.*'), absolute('dir', 'b.*') ]],
                [[ [ absolute('a.*'), absolute('dir', 'b.*') ] ]],
                [[ [ absolute('a.*')], [ absolute('dir', 'b.*') ] ]],
                [[ { path: absolute('a.*') }, { path: absolute('dir', 'b.*') } ]],
                [[ [ { path: absolute('a.*') }, { path: absolute('dir', 'b.*') } ] ]],
                [[ [ { path: absolute('a.*') }], [{ path: absolute('dir', 'b.*') } ] ]],
                [[ absolute('a.*'), { path: absolute('dir', 'b.*') } ]],
                [[ absolute('a.*'), { customPath: absolute('dir', 'b.*') }, function(x) { return x.customPath; } ]]
            ], function (params) {

                var files = paths.expand.apply(null, params);

                expect(files).to.have.length(2);

                expect(relative(files[0])).to.equal('a.xml');
                expect(files[0].context).to.exist();

                expect(relative(files[1])).to.equal('dir/b.xml');
                expect(files[1].context).to.exist();
            })();

        });
     
        it('should not resolve directories', function() {
            var files = paths.expand(absolute('**', '*'));

            expect(files).to.have.length(4);

            expect(relative(files[0])).to.equal('a.xml');
            expect(relative(files[1])).to.equal('b.xml');
            expect(relative(files[2])).to.equal('dir/a.xml');
            expect(relative(files[3])).to.equal('dir/b.xml');

        });
     
        it('should return unique string results', function() {
            var files = paths.expand(absolute('**', 'a.*'), absolute('**', 'a.*'));

            expect(files).to.have.length(2);

            expect(relative(files[0])).to.equal('a.xml');
            expect(relative(files[1])).to.equal('dir/a.xml');

        });
     
        it('should not return unique object results', function() {
            var files = paths.expand({ path: absolute('**', 'a.*') }, { path: absolute('**', 'a.*') });

            expect(files).to.have.length(4);

            expect(relative(files[0])).to.equal('a.xml');
            expect(relative(files[1])).to.equal('dir/a.xml');
            expect(relative(files[2])).to.equal('a.xml');
            expect(relative(files[3])).to.equal('dir/a.xml');

        });
     
        it('should pass context with objects', function() {
            var context = { path: absolute('a.*') }
            var files = paths.expand(context);

            expect(relative(files[0])).to.equal('a.xml');
            expect(files[0].context).to.equal(context);

        });
     
        it('should pass empty context with strings', function() {
            var files = paths.expand(absolute('a.*'));

            expect(relative(files[0])).to.equal('a.xml');
            expect(files[0].context).to.deep.equal({});

        });

        it('should fail if no files', cases([
          [[ ]],
          [[ function(x) { return x.customPath; } ]]
        ], function (params) {
            expect(function() { paths.expand.apply(null, params); }).to.throw(Error);
        }));

    });
});
