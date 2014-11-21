"use strict";

var _ = require('lodash'),
    xmldom = require('xmldom'),
    xmlParser = new xmldom.DOMParser();

_.mixin(require('underscore.string').exports());

var ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = 2;
var CDATA_SECTION_NODE = 4;

function XmlString(xml) {
    this.source = xml;
}

function isXmlString(object) {
    return object instanceof XmlString;
}

function CDataValue(value) {
    this.value = value;
}

function isCDataValue(object) {
    return object instanceof CDataValue;
}

function parsePredicates(path) {
    var regex = /(\[(.*?)=\s*'(.*?)'\s*\])/g;
    var predicates = [], predicate;
    while (predicate = regex.exec(path)) {
        predicates.push({
            name: _.ltrim(_.trim(predicate[2]), '@'), 
            value: predicate[3], 
            attribute: _.startsWith(_.trim(predicate[2]), '@')
        });
    }
    return predicates;
}

function parseXPath(path) {
    var segments = path.match(/(.*)\/([^\[]*)/);
    if (!segments) return null;
    var node = {
        path: _.trim(segments[1]), 
        name: _.ltrim(_.trim(segments[2]), '@'), 
        attribute: _.startsWith(_.trim(segments[2]), '@'),
        keys: parsePredicates(path)
    };
    return node;
}

function joinXPath(path1, path2) {
    return path1 ? _.rtrim(path1, '/') + '/' + _.ltrim(path2, '/') : path2;
}

function mapNamespaces(name, pathNamespaces, parent) {
    var nameParts = name.split(':');
    if (name.length == 1) return name;
    var prefix = parent.lookupPrefix(pathNamespaces[nameParts[0]]);
    return (prefix ? prefix + ':' : '') + nameParts[1];
}

function removeNode(node) {
    node.parentNode.removeChild(node);
}

function clearChildNodes(node) {
    while (node.firstChild) {
        node.removeChild(node.firstChild);
    }
}

function setNodeValue(node, value) {
    if (_.isFunction(value)) value = value(node, getNodeValue(node));
    if (node.nodeType == ATTRIBUTE_NODE) {                     
        node.value = value;
    } 
    else if (isCDataValue(value)) {
        clearChildNodes(node);
        node.appendChild(node.ownerDocument
            .createCDATASection(value.value));
    }
    else if (isXmlString(value)) {
        clearChildNodes(node);
        node.appendChild(xmlParser.parseFromString(value.source));
    }
    else {
        node.textContent = value;
    }
}

function getNodeValue(node) {
    return node.nodeType == ATTRIBUTE_NODE ? 
        node.value : node.textContent;
}

function addNode(namespaces, parent, name, isAttribute, value) {
    name = mapNamespaces(name, namespaces, parent);
    var node;
    if (isAttribute) {
        node = parent.ownerDocument.createAttribute(name);
        parent.setAttributeNode(node);
    }
    else {
        node = parent.ownerDocument.createElement(name);
        parent.appendChild(node);
    }
    if (value) setNodeValue(node, value);
    return node;
}

function getAttributesNamed(namespaces, nodes, name) {
    return _.map(nodes, function(x) { 
        return x.getAttributeNode(name) || 
            addNode(namespaces, x, name, true); 
    });
}

function getChildElementsNamed(namespaces, nodes, name) {
    return _.chain(nodes)
        .map(function(x) { 
            var results = 
                _.chain(x.childNodes)
                    .toArray()
                    .where(function(x) { 
                        return x.nodeName == name && 
                               x.nodeType == ELEMENT_NODE; 
                    }).value(); 
            return results.length > 0 ? results : 
                addNode(namespaces, x, name);
        })
        .flatten()
        .value();
}

module.exports = {
    XmlString: XmlString,
    isXmlString: isXmlString,
    CDataValue: CDataValue,
    isCDataValue: isCDataValue,
    parseXPath: parseXPath,
    joinXPath: joinXPath,
    removeNode: removeNode,
    clearChildNodes: clearChildNodes,
    setNodeValue: setNodeValue,
    getNodeValue: getNodeValue,
    mapNamespaces: mapNamespaces,
    addNode: addNode,
    getAttributesNamed: getAttributesNamed,
    getChildElementsNamed: getChildElementsNamed
};