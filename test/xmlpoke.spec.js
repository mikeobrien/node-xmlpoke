"use strict";

var expect = require('chai').expect,
    temp = require('temp').track(),
    path = require('path'),
    fs = require('fs'),
    xmlpoke = require('../src/xmlpoke');

describe('xmlpoke', function() {

    var basePath, fileAPath, fileBPath, fileDirAPath, fileDirBPath;

    beforeEach(function() {

        basePath = temp.mkdirSync();

        fileAPath = path.join(basePath, 'a.xml');
        fs.writeFileSync(fileAPath, '<a><b/></a>');

        fileBPath = path.join(basePath, 'b.xml');
        fs.writeFileSync(fileBPath, '<a><b/></a>');

        fs.mkdirSync(path.join(basePath, 'dir'));

        fileDirAPath = path.join(basePath, 'dir', 'a.xml');
        fs.writeFileSync(fileDirAPath, '<a><b/></a>');

        fileDirBPath = path.join(basePath, 'dir', 'b.xml');
        fs.writeFileSync(fileDirBPath, '<a><b/></a>');

    });

    afterEach(function() {
        temp.cleanupSync();
    });

    it('should poke files', function() {

        xmlpoke(path.join(basePath, '**/a.*'), function(xml) {
            xml.set('a/b', 'c');
        });

        expect(fs.readFileSync(fileAPath).toString()).to.equal('<a><b>c</b></a>');
        expect(fs.readFileSync(fileBPath).toString()).to.equal('<a><b/></a>');
        expect(fs.readFileSync(fileDirAPath).toString()).to.equal('<a><b>c</b></a>');
        expect(fs.readFileSync(fileDirBPath).toString()).to.equal('<a><b/></a>');

    });

    it('should should poke paths and objects with default path', function() {

        xmlpoke(path.join(basePath, 'a.*'),
            { path: path.join(basePath, 'dir/a.*'), value: 'd' },
            function(xml, context) {
                xml.set('a/b', context.value || 'c');
            });

        expect(fs.readFileSync(fileAPath).toString()).to.equal('<a><b>c</b></a>');
        expect(fs.readFileSync(fileBPath).toString()).to.equal('<a><b/></a>');
        expect(fs.readFileSync(fileDirAPath).toString()).to.equal('<a><b>d</b></a>');
        expect(fs.readFileSync(fileDirBPath).toString()).to.equal('<a><b/></a>');

    });

    it('should should poke paths and objects with custom path', function() {

        xmlpoke(path.join(basePath, 'a.*'),
            { customPath: path.join(basePath, 'dir/a.*'), value: 'd' },
            function(x) { return x.customPath; },
            function(xml, context) {
                xml.set('a/b', context.value || 'c');
            });

        expect(fs.readFileSync(fileAPath).toString()).to.equal('<a><b>c</b></a>');
        expect(fs.readFileSync(fileBPath).toString()).to.equal('<a><b/></a>');
        expect(fs.readFileSync(fileDirAPath).toString()).to.equal('<a><b>d</b></a>');
        expect(fs.readFileSync(fileDirBPath).toString()).to.equal('<a><b/></a>');

    });

    it('should poke files with cdata', function() {

        xmlpoke(path.join(basePath, '**/a.*'), function(xml) {
            xml.set('a/b', xml.CDataValue('c'));
        });

        expect(fs.readFileSync(fileAPath).toString()).to.equal('<a><b><![CDATA[c]]></b></a>');
        expect(fs.readFileSync(fileBPath).toString()).to.equal('<a><b/></a>');
        expect(fs.readFileSync(fileDirAPath).toString()).to.equal('<a><b><![CDATA[c]]></b></a>');
        expect(fs.readFileSync(fileDirBPath).toString()).to.equal('<a><b/></a>');

    });

    it('should poke files with cdata outside dsl', function() {

        var cdata = new xmlpoke.CDataValue('c')

        xmlpoke(path.join(basePath, '**/a.*'), function(xml) {
            xml.set('a/b', cdata);
        });

        expect(fs.readFileSync(fileAPath).toString()).to.equal('<a><b><![CDATA[c]]></b></a>');
        expect(fs.readFileSync(fileBPath).toString()).to.equal('<a><b/></a>');
        expect(fs.readFileSync(fileDirAPath).toString()).to.equal('<a><b><![CDATA[c]]></b></a>');
        expect(fs.readFileSync(fileDirBPath).toString()).to.equal('<a><b/></a>');

    });

    it('should poke files with xml', function() {

        xmlpoke(path.join(basePath, '**/a.*'), function(xml) {
            xml.set('a/b', xml.XmlString('<c/>'));
        });

        expect(fs.readFileSync(fileAPath).toString()).to.equal('<a><b><c/></b></a>');
        expect(fs.readFileSync(fileBPath).toString()).to.equal('<a><b/></a>');
        expect(fs.readFileSync(fileDirAPath).toString()).to.equal('<a><b><c/></b></a>');
        expect(fs.readFileSync(fileDirBPath).toString()).to.equal('<a><b/></a>');

    });

    it('should poke files with xml outside dsl', function() {

        var xmlstring = new xmlpoke.XmlString('<c/>');

        xmlpoke(path.join(basePath, '**/a.*'), function(xml) {
            xml.set('a/b', xmlstring);
        });

        expect(fs.readFileSync(fileAPath).toString()).to.equal('<a><b><c/></b></a>');
        expect(fs.readFileSync(fileBPath).toString()).to.equal('<a><b/></a>');
        expect(fs.readFileSync(fileDirAPath).toString()).to.equal('<a><b><c/></b></a>');
        expect(fs.readFileSync(fileDirBPath).toString()).to.equal('<a><b/></a>');

    });

    it('should poke string', function() {

        var xml = xmlpoke('<a/>', function(xml) {
            xml.set('a', 'b');
        });

        expect(xml).to.equal('<a>b</a>');

    });

    it('should poke boolean', function() {

        var xml = xmlpoke('<a/>', function(xml) {
            xml.set('a', true);
        });

        expect(xml).to.equal('<a>true</a>');

    });

    it('should poke numbers', function() {

        var xml = xmlpoke('<a/>', function(xml) {
            xml.set('a', 5);
        });

        expect(xml).to.equal('<a>5</a>');

    });

});
