"use strict";

var fs = require('fs'),
    xmldom = require('xmldom'),
    xmlParser = new xmldom.DOMParser(),
    xmlSerializer = new xmldom.XMLSerializer(),
    xpath = require('xpath'),
    xml = require('./xml'),
    _ = require('lodash');

_.mixin(require('underscore.string').exports());

function throwNoMatchingNodesError(path) {
    var warning = "No matching nodes for xpath '" + path + "'.";
    console.log(warning);
    throw new Error(warning);
}

function setNodeValues(namespaces, nodes, value) {

    if (!nodes || nodes.length == 0) return;

    if (_.isString(value) || xml.isXmlString(value) || 
        xml.isCDataValue(value) || _.isFunction(value)) 
        nodes.forEach(function(node) { xml.setNodeValue(node, value); });
    else {
        var set = _.partial(setNodeValues, namespaces);
        _.forOwn(value, function(value, name) {
            if (_.startsWith(name, '@')) 
                set(xml.getAttributesNamed(namespaces, nodes, name.slice(1)), value);
            else set(xml.getChildElementsNamed(namespaces, nodes, name), value);
        });
    }
};

function createNodes(query, path, errorOnNoMatches) {
    var child = xml.parseXPath(path);
    var parents = query.getNodes(child.path);
    if (parents.length == 0) {
        if (errorOnNoMatches) throwNoMatchingNodesError(child.path);
        return [];
    }
    var add = _.partial(xml.addNode, query.namespaces);
    return parents.map(function(parent) {
        var node = add(parent, child.name, child.attribute);
        if (child.keys.length > 0) child.keys.forEach(function(key) {
            add(node, key.name, key.attribute, key.value);
        });
        return node;
    });
}

function buildQuery(document, namespaces) {
    var select = namespaces ? xpath.useNamespaces(namespaces) : xpath.select;
    return {
        namespaces: namespaces,
        getNodes: function(path) {
            return select(path, document);
        }
    };
}

function queryNodes(query, path, errorOnNoMatches, addIfMissing) {

    var nodes = query.getNodes(path);

    if (nodes.length > 0) return nodes;
    else if (addIfMissing) return createNodes(query, path, errorOnNoMatches);
    else if (errorOnNoMatches) throwNoMatchingNodesError(path);

    return nodes;
};

function clearNodes(query) {
    query.forEach(function(x) { xml.clearChildNodes(x); });
}

function removeNodes(query) {
    query.forEach(function(x) { xml.removeNode(x); });
}

function openXmlFile(path, encoding) {
    encoding = encoding || 'utf8';
    var document = loadXml(fs.readFileSync(path, encoding))
    document.save = function() {
        fs.writeFileSync(path, document.toString(), encoding);
    }
    return document;
}

function loadXml(source) {
    var document = xmlParser.parseFromString(source)
    var basePath, namespaces, errorOnNoMatches;

    var query = function(path, errorOnNoMatches, addIfMissing) {
        return queryNodes(
            buildQuery(document, namespaces), 
            xml.joinXPath(basePath, path), 
            errorOnNoMatches, addIfMissing);
    }

    var dsl = {

        withBasePath: function(path) {
            basePath = path;
            return dsl;
        },

        addNamespace: function(prefix, uri) {
            namespaces = namespaces || {};
            namespaces[prefix] = uri;
            return dsl;
        },

        errorOnNoMatches: function(prefix, uri) {
            errorOnNoMatches = true;
            return dsl;
        },

        clear: function(path) {
            clearNodes(query(path, errorOnNoMatches, false));
            return dsl;
        },

        remove: function(path) {
            removeNodes(query(path, false, false));
            return dsl;
        },

        set: function(path, value) {
            setNodeValues(namespaces, query(path, 
                errorOnNoMatches, false), value);
            return dsl;
        },

        setOrAdd: function(path, value) {
            setNodeValues(namespaces, query(path, 
                errorOnNoMatches, true), value);
            return dsl;
        },

        XmlString: function(value) {
            return new xml.XmlString(value);
        },

        CDataValue: function(value) {
            return new xml.CDataValue(value);
        },

        toString: function() {
            return xmlSerializer.serializeToString(document);
        }
    };
    return dsl;
}

module.exports = {
    open: openXmlFile,
    load: loadXml,
    XmlString: xml.XmlString,
    CDataValue: xml.CDataValue
};