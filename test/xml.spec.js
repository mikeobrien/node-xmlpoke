"use strict";

var expect = require('chai').expect,
    cases = require('cases'),
    _ = require('lodash'),
    xmldom = require('xmldom'),
    xmlParser = new xmldom.DOMParser(),
    xpath = require('xpath'),
    xml = require('../src/xml');

describe('xml', function() {

    describe('parseXPath', function() {

        it('should parse xpath', cases([
            [ 'a/b/c', { path: 'a/b', name: 'c', attribute: false, keys: [] } ],
            [ 'a/b/@c', { path: 'a/b', name: 'c', attribute: true, keys: [] } ],

            [ "a/b/c[name='value']", { path: 'a/b', name: 'c', attribute: false, 
                keys: [ { name: 'name', value: 'value', attribute: false } ] } ],
            [ "a/b/c[@name='value']", { path: 'a/b', name: 'c', attribute: false, 
                keys: [ { name: 'name', value: 'value', attribute: true } ] } ],
            [ "a/b[@name1='value1']/c[@name2='value2']", { path: "a/b[@name1='value1']", name: 'c', attribute: false, 
                keys: [ { name: 'name2', value: 'value2', attribute: true } ]} ],
            [ "a/b/c[@name1='value1' and @name2='value2']", { path: 'a/b', name: 'c', attribute: false, 
                keys: [ { name: 'name1', value: 'value1', attribute: true },
                        { name: 'name2', value: 'value2', attribute: true } ]} ],
            [ "a/b/c[@name1='value1' and @name2='value2' and @name3='value3']", { path: 'a/b', name: 'c', attribute: false, 
                keys: [ { name: 'name1', value: 'value1', attribute: true },
                        { name: 'name2', value: 'value2', attribute: true },
                        { name: 'name3', value: 'value3', attribute: true } ]} ],

            [ "a/b/c [ @name = 'value' ]", { path: 'a/b', name: 'c', attribute: false, 
              keys: [ { name: 'name', value: 'value', attribute: true } ] } ],
            [ "a/b/c[0]", { path: 'a/b', name: 'c', attribute: false, keys: [] } ],
            [ "a/b/c[last()]", { path: 'a/b', name: 'c', attribute: false, keys: [] } ]
        ], function (query, result) {
            expect(xml.parseXPath(query)).to.deep.equal(result);
        }));

    });

    describe('getNodeValue', function() {

        it('should parse xpath', cases([
            [ '<a b="c"/>', 'a/@b' ],
            [ '<a><b>c</b></a>', 'a/b' ],
            [ '<a><b><![CDATA[c]]></b></a>', 'a/b' ]
        ], function (source, path) {
            var node = xpath.select(path , xmlParser.parseFromString(source))[0];
            expect(xml.getNodeValue(node)).to.deep.equal('c');
        }));

    });

    describe('XmlString', function() {

        it('should indicate if object is xml string', cases([
            [ new Object(), false ],
            [ new xml.XmlString('<a/>'), true ]
        ], function (object, isXmlString) {
            expect(xml.isXmlString(object)).to.equal(isXmlString);
        }));

        it('should return xml string', function () {
            var xmlString = new xml.XmlString('<a/>');
            expect(xmlString.source).to.equal('<a/>');
        });

    });

    describe('CDataValue', function() {

        it('should indicate if object is cdata value', cases([
            [ new Object(), false ],
            [ new xml.CDataValue('value'), true ]
        ], function (object, isCDataValue) {
            expect(xml.isCDataValue(object)).to.equal(isCDataValue);
        }));

        it('should return cdata value', function () {
            var cdata = new xml.CDataValue('value');
            expect(cdata.value).to.equal('value');
        });

    });

    it('should join xpath', cases([
        [ '/a/', '/b/', '/a/b/' ],
        [ null, '/b/', '/b/'  ]
    ], function (path1, path2, result) {
        expect(xml.joinXPath(path1, path2)).to.equal(result);
    }));

    it('should map namespaces', cases([
        [ '<el xmlns="uri:yada"/>', 'attr', null, 'attr' ],
        [ '<el xmlns="uri:yada"/>', 'x:attr', 'uri:yada', 'attr' ],
        [ '<el xmlns:z="uri:yada"/>', 'x:attr', 'uri:yada', 'z:attr' ]
    ], function (source, sourceName, namespace, name) {
        var parent = xmlParser.parseFromString(source).firstChild;
        var node = xml.mapNamespaces(sourceName, parent, { x: 'uri:yada' });
        expect(node.namespace).to.equal(namespace);
        expect(node.name).to.equal(name);
    }));

    it('should clear children', function () {
        var doc = xmlParser.parseFromString('<a><b/><c/></a>');
        xml.clearChildNodes(doc.firstChild);
        expect(doc.toString()).to.equal('<a/>');
    });

    it('should set node value', cases([
        [ '<a><b/></a>', 'c', '<a><b>c</b></a>' ],
        [ '<a b=""/>', 'c', '<a b="c"/>' ],

        [ '<a b="c"/>', function(node, value) { return node.name + value ; }, '<a b="bc"/>' ],
        [ '<a><b>c</b></a>', function(node, value) { return node.nodeName + value; }, '<a><b>bc</b></a>' ],

        [ '<a><b/></a>', new xml.CDataValue('c'), '<a><b><![CDATA[c]]></b></a>' ],
        [ '<a><b>c</b></a>', function(node, value) { return new xml.CDataValue(node.nodeName + value); }, 
          '<a><b><![CDATA[bc]]></b></a>' ],

        [ '<a><b/></a>', new xml.XmlString('<c>d</c>'), '<a><b><c>d</c></b></a>' ],
        [ '<a><b>c</b></a>', function(node, value) { 
                return new xml.XmlString('<' + value + '>' + node.nodeName + '</' + value + '>'); }, 
            '<a><b><c>b</c></b></a>' ]
    ], function (source, value, result) {
        var doc = xmlParser.parseFromString(source);
        xml.setNodeValue(doc.firstChild.firstChild || 
            doc.firstChild.attributes[0], value);
        expect(doc.toString()).to.equal(result);
    }));

    it('should get node value', cases([
        [ '<a><b>c</b></a>' ],
        [ '<a b="c"/>' ]
    ], function (source) {
        var doc = xmlParser.parseFromString(source);
        var result = xml.getNodeValue(doc.firstChild.firstChild || 
            doc.firstChild.attributes[0]);
        expect(result).to.equal('c');
    }));

    describe('addNode', function() {

      it('should add attribute with value', function () {
          var doc = xmlParser.parseFromString('<a/>');
          xml.addNode({}, doc.firstChild, 'b', true, 'c');
          expect(doc.toString()).to.equal('<a b="c"/>');
      });

      it('should add element without value', function () {
          var doc = xmlParser.parseFromString('<a/>');
          xml.addNode({}, doc.firstChild, 'b', false);
          expect(doc.toString()).to.equal('<a><b/></a>');
      });

      it('should add element with string value', function () {
          var doc = xmlParser.parseFromString('<a/>');
          xml.addNode({}, doc.firstChild, 'b', false, 'c');
          expect(doc.toString()).to.equal('<a><b>c</b></a>');
      });

      it('should add attribute with mapped namespace', function () {
          var doc = xmlParser.parseFromString('<a xmlns:z="uri:yada"/>');
          xml.addNode({ x: 'uri:yada' }, doc.firstChild, 'x:b', true, 'c');
          expect(doc.toString()).to.equal('<a xmlns:z="uri:yada" z:b="c"/>');
      });

      it('should add element with mapped namespace', function () {
          var doc = xmlParser.parseFromString('<a xmlns:z="uri:yada"/>');
          xml.addNode({ x: 'uri:yada' }, doc.firstChild, 'x:b', false);
          expect(doc.toString()).to.equal('<a xmlns:z="uri:yada"><z:b/></a>');
      });

    });

    describe('getAttributesNamed', function() {

      it('should get attributes named', function () {
          var doc = xmlParser.parseFromString('<a><b d="1" e="2"/><c e="4" d="3"/></a>');
          var results = xml.getAttributesNamed({}, doc.firstChild.childNodes, 'd');

          expect(results).to.have.length(2);

          expect(results[0].name).to.equal('d');
          expect(results[0].value).to.equal('1');
          
          expect(results[1].name).to.equal('d');
          expect(results[1].value).to.equal('3');
      });

      it('should create if not found', function () {
          var doc = xmlParser.parseFromString('<a><b e="2"/><c e="4"/></a>');
          var results = xml.getAttributesNamed({}, doc.firstChild.childNodes, 'd');

          expect(results).to.have.length(2);

          expect(results[0].name).to.equal('d');
          expect(results[0].value).to.be.empty;
          
          expect(results[1].name).to.equal('d');
          expect(results[1].value).to.be.empty;

          results[0].value = '';
          results[1].value = '';

          expect(doc.toString()).to.equal('<a><b e="2" d=""/><c e="4" d=""/></a>');
      });

      it('should create if not found and map namespace', function () {
          var doc = xmlParser.parseFromString('<a xmlns:z="uri:yada"><b/></a>');
          var results = xml.getAttributesNamed({ x: 'uri:yada' }, doc.firstChild.childNodes, 'x:d');

          expect(results).to.have.length(1);

          expect(results[0].name).to.equal('z:d');
          expect(results[0].value).to.be.empty;

          results[0].value = '';

          expect(doc.toString()).to.equal('<a xmlns:z="uri:yada"><b z:d=""/></a>');
      });

    });

    describe('getChildElementsNamed', function() {

      it('should get elements named', function () {
          var doc = xmlParser.parseFromString('<a><b><d>1</d><e>2</e></b><c><e>4</e><d>3</d></c></a>');
          var results = xml.getChildElementsNamed({}, doc.firstChild.childNodes, 'd');

          expect(results).to.have.length(2);

          expect(results[0].nodeName).to.equal('d');
          expect(results[0].textContent).to.equal('1');
          
          expect(results[1].nodeName).to.equal('d');
          expect(results[1].textContent).to.equal('3');
      });

      it('should create if not found', function () {
          var doc = xmlParser.parseFromString('<a><b><e>2</e></b><c><e>4</e></c></a>');
          var results = xml.getChildElementsNamed({}, doc.firstChild.childNodes, 'd');

          expect(results).to.have.length(2);

          expect(results[0].nodeName).to.equal('d');
          expect(results[0].textContent).to.be.empty;
          
          expect(results[1].nodeName).to.equal('d');
          expect(results[1].textContent).to.be.empty;

          expect(doc.toString()).to.equal('<a><b><e>2</e><d/></b><c><e>4</e><d/></c></a>');
      });

      it('should create if not found and map namespace', function () {
          var doc = xmlParser.parseFromString('<a xmlns:z="uri:yada"><b/></a>');
          var results = xml.getChildElementsNamed({ x: 'uri:yada' }, doc.firstChild.childNodes, 'x:d');

          expect(results).to.have.length(1);

          expect(results[0].prefix).to.equal('z');
          expect(results[0].localName).to.equal('d');
          expect(results[0].textContent).to.be.empty;

          expect(doc.toString()).to.equal('<a xmlns:z="uri:yada"><b><z:d/></b></a>');
      });

    });

});
