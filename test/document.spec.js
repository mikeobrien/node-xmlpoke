"use strict";

var expect = require('chai').expect,
    temp = require('temp').track(),
    fs = require('fs'),
    Document = require('../src/document');

describe('document', function() {

    var xmlfile;

    beforeEach(function() {
        xmlfile = temp.openSync().path;
    });

    afterEach(function() {
        temp.cleanupSync();
    });

    it('should open an xml file', function() {
        fs.writeFileSync(xmlfile, '<a><b/></a>');
        expect(Document.open(xmlfile).toString())
            .to.equal('<a><b/></a>');
    });

    it('should save an xml file', function() {
        fs.writeFileSync(xmlfile, '<a><b/></a>');
        var doc = Document.open(xmlfile);
        doc.set('a/b', 'c');
        doc.save();
        expect(fs.readFileSync(xmlfile).toString())
            .to.equal('<a><b>c</b></a>');
    });

    describe('clear', function() {

        it('should clear child nodes', function() {
            expect(Document.load('<a><b/><c/></a>')
                .clear('a').toString())
                .to.equal('<a/>');
        });

        it('should not fail if no matches by default', function() {
            expect(Document.load('<a/>')
                .clear('a/b').toString())
                .to.equal('<a/>');
        });

        it('should fail if no matches when configured', function() {
            expect(function() { 
                    Document.load('<a/>')
                        .errorOnNoMatches()
                        .clear('a/b'); })
                .to.throw("No matching nodes for xpath 'a/b'.");
        });

    });

    describe('remove', function() {

        it('should remove nodes', function() {
            expect(Document.load('<a><b/><b/><c/></a>')
                .remove('a/b').toString())
                .to.equal('<a><c/></a>');
        });

    });

    describe('set', function() {

        describe('base path', function() {

            it('should add base path when configured', function() {
                expect(Document.load('<a><b/></a>')
                    .withBasePath('a')
                    .set('b', 'c').toString())
                    .to.equal('<a><b>c</b></a>');
            });
            
        });

        describe('object values', function() {

            it('should add multiple', function() {
                expect(Document.load('<a><b/><c/></a>')
                    .set({ 'a/b': 'd', 'a/c': 'e' }).toString())
                    .to.equal('<a><b>d</b><c>e</c></a>');
            });
            
        });

        describe('missing elements', function() {

            it('should not fail to set missing value by default', function() {
                expect(function() { Document.load('<a/>').set('a/b/c', 'c'); })
                    .not.to.throw();
            });

            it('should fail to set missing value when configured', function() {
                expect(function() { 
                        Document.load('<a/>')
                            .errorOnNoMatches()
                            .set('a/b/c', 'c'); })
                    .to.throw("No matching nodes for xpath 'a/b/c'.");
            });

        });

        describe('namespaces', function() {

            it('should set node value with default namespace when configured', function() {
                expect(Document.load('<a xmlns="uri:yada"><b/></a>')
                    .addNamespace('z', 'uri:yada')
                    .set('/z:a/z:b', 'c').toString())
                    .to.equal('<a xmlns="uri:yada"><b>c</b></a>');
            });

            it('should set attribute value with default namespace when configured', function() {
                expect(Document.load('<a xmlns="uri:yada" b="" />')
                    .addNamespace('z', 'uri:yada')
                    .set('/z:a/@b', 'c').toString())
                    .to.equal('<a xmlns="uri:yada" b="c"/>');
            });

            it('should set node value with namespace when configured', function() {
                expect(Document.load('<a xmlns:x="uri:yada"><x:b/></a>')
                    .addNamespace('z', 'uri:yada')
                    .set('a/z:b', 'c').toString())
                    .to.equal('<a xmlns:x="uri:yada"><x:b>c</x:b></a>');
            });

            it('should set attribute value with namespace when configured', function() {
                expect(Document.load('<a xmlns:x="uri:yada" x:b="" />')
                    .addNamespace('z', 'uri:yada')
                    .set('a/@z:b', 'c').toString())
                    .to.equal('<a xmlns:x="uri:yada" x:b="c"/>');
            });
 
        });

        describe('string', function() {

            it('should set attribute value', function() {
                expect(Document.load('<a b=""/>')
                    .set('a/@b', 'c').toString())
                    .to.equal('<a b="c"/>');
            });

            it('should set node value', function() {
                expect(Document.load('<a/>')
                    .set('a', 'b').toString())
                    .to.equal('<a>b</a>');
            });

            it('should set node cdata value', function() {
                expect(Document.load('<a/>')
                    .set('a', new Document.CDataValue('b')).toString())
                    .to.equal('<a><![CDATA[b]]></a>');
            });

            it('should set node xml value', function() {
                expect(Document.load('<a/>')
                    .set('a', new Document.XmlString('<b/>')).toString())
                    .to.equal('<a><b/></a>');
            });
            
        });

        describe('function', function() {

            it('should set attribute value', function() {
                expect(Document.load('<a b="c"/>')
                    .set('a/@b', function(node, value) { 
                        return [ node.nodeName, value, 'd' ].join('-'); }).toString())
                    .to.equal('<a b="b-c-d"/>');
            });

            it('should set node value', function() {
                expect(Document.load('<a>b</a>')
                    .set('a', function(node, value) { 
                        return [ node.nodeName, value, 'c' ].join('-'); }).toString())
                    .to.equal('<a>a-b-c</a>');
            });

            it('should set node cdata value', function() {
                expect(Document.load('<a>b</a>')
                    .set('a', function(node, value) { 
                        return new Document.CDataValue([ node.nodeName, value, 'c' ].join('-')); }).toString())
                    .to.equal('<a><![CDATA[a-b-c]]></a>');
            });

            it('should set node xml value', function() {
                expect(Document.load('<a>b</a>')
                    .set('a', function(node, value) { 
                        return new Document.XmlString('<' + value + '>' + node.nodeName + '</' + value + '>'); }).toString())
                    .to.equal('<a><b>a</b></a>');
            });
            
        });

        describe('object string', function() {

            it('should set attribute value', function() {
                expect(Document.load('<a b=""/>')
                    .set('a', { '@b': 'c' }).toString())
                    .to.equal('<a b="c"/>');
            });

            it('should set node value', function() {
                expect(Document.load('<a><b/></a>')
                    .set('a', { b: 'c' }).toString())
                    .to.equal('<a><b>c</b></a>');
            });

            it('should set node cdata value', function() {
                expect(Document.load('<a><b/></a>')
                    .set('a', { b: new Document.CDataValue('c') }).toString())
                    .to.equal('<a><b><![CDATA[c]]></b></a>');
            });

            it('should set node sql value', function() {
                expect(Document.load('<a><b/></a>')
                    .set('a', { b: new Document.XmlString('<c/>') }).toString())
                    .to.equal('<a><b><c/></b></a>');
            });
            
        });

        describe('object function', function() {

            it('should set attribute value', function() {
                expect(Document.load('<a b="c"/>')
                    .set('a', { '@b': function(node, value) { 
                        return [ node.nodeName, value, 'd' ].join('-'); } }).toString())
                    .to.equal('<a b="b-c-d"/>');
            });

            it('should set node value', function() {
                expect(Document.load('<a><b>c</b></a>')
                    .set('a', { b: function(node, value) { 
                        return [ node.nodeName, value, 'd' ].join('-'); } }).toString())
                    .to.equal('<a><b>b-c-d</b></a>');
            });

            it('should set node cdata value', function() {
                expect(Document.load('<a><b>c</b></a>')
                    .set('a', { b: function(node, value) { 
                        return new Document.CDataValue([ node.nodeName, value ].join('-')); } }).toString())
                    .to.equal('<a><b><![CDATA[b-c]]></b></a>');
            });

            it('should set node xml value', function() {
                expect(Document.load('<a><b>c</b></a>')
                    .set('a', { b: function(node, value) { 
                        return new Document.XmlString('<' + value + '>' + node.nodeName + '</' + value + '>'); } }).toString())
                    .to.equal('<a><b><c>b</c></b></a>');
            });
            
        });

    });

    describe('setOrAdd', function() {

        describe('base path', function() {

            it('should add base path when configured', function() {
                expect(Document.load('<a><b/></a>')
                    .withBasePath('a')
                    .setOrAdd('b', 'c').toString())
                    .to.equal('<a><b>c</b></a>');
            });

        });

        describe('object values', function() {

            it('should add multiple', function() {
                expect(Document.load('<a/>')
                    .setOrAdd({ 'a/b': 'd', 'a/c': 'e' }).toString())
                    .to.equal('<a><b>d</b><c>e</c></a>');
            });
            
        });

        describe('missing elements', function() {

            it('should not fail to create missing parent node by default', function() {
                expect(function() { Document.load('<a/>').setOrAdd('a/b/c', 'd'); })
                    .not.to.throw();
            });

            it('should fail to create missing parent node when configured', function() {
                expect(function() { 
                        Document.load('<a/>')
                            .errorOnNoMatches()
                            .setOrAdd('a/b/c', 'd'); })
                    .to.throw("No matching nodes for xpath 'a/b'.");
            });

        });

        describe('namespaces', function() {

            it('should add node value with default namespace when configured', function() {
                expect(Document.load('<a xmlns="uri:yada"/>')
                    .addNamespace('z', 'uri:yada')
                    .setOrAdd('/z:a/z:b', 'c').toString())
                    .to.equal('<a xmlns="uri:yada"><b>c</b></a>');
            });

            it('should add attribute value with default namespace when configured', function() {
                expect(Document.load('<a xmlns="uri:yada"/>')
                    .addNamespace('z', 'uri:yada')
                    .setOrAdd('/z:a/@b', 'c').toString())
                    .to.equal('<a xmlns="uri:yada" b="c"/>');
            });

            it('should add non existing node value with namespace when configured', function() {
                expect(Document.load('<a xmlns:x="uri:yada"/>')
                    .addNamespace('z', 'uri:yada')
                    .setOrAdd('a/z:b', 'c').toString())
                    .to.equal('<a xmlns:x="uri:yada"><x:b>c</x:b></a>');
            });

            it('should add attribute value with namespace when configured', function() {
                expect(Document.load('<a xmlns:x="uri:yada"/>')
                    .addNamespace('z', 'uri:yada')
                    .setOrAdd('a/@z:b', 'c').toString())
                    .to.equal('<a xmlns:x="uri:yada" x:b="c"/>');
            });

            it('should add node object value with namespace when configured', function() {
                expect(Document.load('<a xmlns:x="uri:yada"/>')
                    .addNamespace('z', 'uri:yada')
                    .setOrAdd('a', { 'z:b': 'c' }).toString())
                    .to.equal('<a xmlns:x="uri:yada"><x:b>c</x:b></a>');
            });

            it('should add attribute object value with namespace when configured', function() {
                expect(Document.load('<a xmlns:x="uri:yada"/>')
                    .addNamespace('z', 'uri:yada')
                    .setOrAdd('a', { '@z:b': 'c' }).toString())
                    .to.equal('<a xmlns:x="uri:yada" x:b="c"/>');
            });
 
        });

        describe('string', function() {

            it('should add attribute value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a/@b', 'c').toString())
                    .to.equal('<a b="c"/>');
            });

            it('should add node value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a/b', 'c').toString())
                    .to.equal('<a><b>c</b></a>');
            });

            it('should add node cdata value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a/b', new Document.CDataValue('c')).toString())
                    .to.equal('<a><b><![CDATA[c]]></b></a>');
            });

            it('should add node xml value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a/b', new Document.XmlString('<c/>')).toString())
                    .to.equal('<a><b><c/></b></a>');
            });
            
        });

        describe('function', function() {

            it('should add attribute value with function', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a/@b', function(node, value) { 
                        return [ node.nodeName, value, 'c' ].join('-'); }).toString())
                    .to.equal('<a b="b--c"/>');
            });

            it('should add node value with function', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a/b', function(node, value) { 
                        return [ node.nodeName, value, 'c' ].join('-'); }).toString())
                    .to.equal('<a><b>b--c</b></a>');
            });

            it('should add node cdata value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a/b', function(node, value) { 
                        return new Document.CDataValue([ node.nodeName, value, 'c' ].join('-')); }).toString())
                    .to.equal('<a><b><![CDATA[b--c]]></b></a>');
            });

            it('should add node xml value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a/b', function(node, value) { 
                        return new Document.XmlString('<c>' + node.nodeName + '</c>'); }).toString())
                    .to.equal('<a><b><c>b</c></b></a>');
            });
            
        });

        describe('object string', function() {

            it('should add attribute value with object string', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a', { '@b': 'c' }).toString())
                    .to.equal('<a b="c"/>');
            });

            it('should add node value with object string', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a', { b: 'c' }).toString())
                    .to.equal('<a><b>c</b></a>');
            });

            it('should add node cdata value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a', { b: new Document.CDataValue('c') }).toString())
                    .to.equal('<a><b><![CDATA[c]]></b></a>');
            });

            it('should add node sql value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a', { b: new Document.XmlString('<c/>') }).toString())
                    .to.equal('<a><b><c/></b></a>');
            });
            
        });

        describe('object function', function() {

            it('should add attribute value with object function', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a', { '@b': function(node, value) { 
                        return [ node.nodeName, value, 'c' ].join('-'); } }).toString())
                    .to.equal('<a b="b--c"/>');
            });

            it('should add node value with object function', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a', { b: function(node, value) { 
                        return [ node.nodeName, value, 'c' ].join('-'); } }).toString())
                    .to.equal('<a><b>b--c</b></a>');
            });

            it('should set node cdata value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a', { b: function(node, value) { 
                        return new Document.CDataValue([ node.nodeName, value, 'c' ].join('-')); } }).toString())
                    .to.equal('<a><b><![CDATA[b--c]]></b></a>');
            });

            it('should set node xml value', function() {
                expect(Document.load('<a/>')
                    .setOrAdd('a', { b: function(node, value) { 
                        return new Document.XmlString('<c>' + node.nodeName + '</c>'); } }).toString())
                    .to.equal('<a><b><c>b</c></b></a>');
            });
            
        });

    });

});
