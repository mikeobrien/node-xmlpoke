"use strict";

var _ = require('lodash'),
    xmldom = require('xmldom'),
    xmlParser = new xmldom.DOMParser();

var ELEMENT_NODE = 1;
var ATTRIBUTE_NODE = 2;

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
    var regex = /((\[|and)\s*([^'=]*)\s*=\s*'([^']*)')/g;
    var predicates = [], predicate;
    while ((predicate = regex.exec(path))) {
        predicates.push({
            name: _.trimStart(_.trim(predicate[3]), '@'),
            value: predicate[4],
            attribute: _.startsWith(_.trim(predicate[3]), '@')
        });
    }
    return predicates;
}

function parseXPath(path) {
    var segments = path.match(/(.*)\/([^\[]*)(.*)/);
    if (!segments) return null;
    var node = {
        path: _.trim(segments[1]),
        name: _.trimStart(_.trim(segments[2]), '@'),
        attribute: _.startsWith(_.trim(segments[2]), '@'),
        keys: parsePredicates(segments[3])
    };
    return node;
}

function joinXPath(path1, path2) {
    return path1 ? _.trimEnd(path1, '/') + '/' + _.trimStart(path2, '/') : path2;
}

function parseQualifiedName(name) {
    var nameParts = name.split(':');
    return {
        prefix: nameParts.length > 1 ? _.first(nameParts) : null,
        name: _.last(nameParts)
    };
}

function mapNamespaces(name, parent, pathNamespaces) {
    name = parseQualifiedName(name);
    var namespace = pathNamespaces && name.prefix ? pathNamespaces[name.prefix] : null;
    var prefix = namespace ? parent.lookupPrefix(namespace) : null;
    return {
        namespace: namespace ? namespace : null,
        name: (prefix ? prefix + ':' : '') + name.name
    };
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
        node.value = node.nodeValue = String(value);
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
        node.textContent = String(value);
    }
}

function getNodeValue(node) {
    return node.nodeType == ATTRIBUTE_NODE ?
        node.value : node.textContent;
}

function addNode(namespaces, parent, name, isAttribute, value) {
    name = mapNamespaces(name, parent, namespaces);
    var node;
    if (isAttribute) {
        node = parent.ownerDocument.createAttributeNS(name.namespace, name.name);
        parent.setAttributeNode(node);
    }
    else {
        node = parent.ownerDocument.createElementNS(name.namespace, name.name);
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
                    .filter({
                        nodeName: name,
                        nodeType: ELEMENT_NODE,
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
