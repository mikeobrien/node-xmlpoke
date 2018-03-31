"use strict";

var fs = require('fs'),
    Args = require('./args'),
    TRAILING_SPACES_REGEX = /\s*$/,
    xmldom = require('xmldom'),
    xmlParser = new xmldom.DOMParser(),
    xmlSerializer = new xmldom.XMLSerializer(),
    xpath = require('xpath'),
    xml = require('./xml'),
    _ = require('lodash');

function throwNoMatchingNodesError(path) {
    var warning = "No matching nodes for xpath '" + path + "'.";
    console.log(warning);
    throw new Error(warning);
}

function setNodeValues(namespaces, nodes, value) {

    if (!nodes || nodes.length == 0) return;

    if (_.isString(value)|| _.isBoolean(value) || _.isNumber(value) ||
        xml.isXmlString(value) || xml.isCDataValue(value) || _.isFunction(value))
        nodes.forEach(function(node) { xml.setNodeValue(node, value); });
    else {
        var set = _.partial(setNodeValues, namespaces);
        _.forOwn(value, function(value, name) {
            if (_.startsWith(name, '@'))
                set(xml.getAttributesNamed(namespaces, nodes, name.slice(1)), value);
            else set(xml.getChildElementsNamed(namespaces, nodes, name), value);
        });
    }
}

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

function queryNodes(query, path, errorOnNoMatches, addIfMissing, alwaysAdd) {

    if (alwaysAdd) return createNodes(query, path, errorOnNoMatches);

    var nodes = query.getNodes(path);

    if (nodes.length > 0) return nodes;
    else if (addIfMissing) return createNodes(query, path, errorOnNoMatches);
    else if (errorOnNoMatches) throwNoMatchingNodesError(path);

    return nodes;
}

function ensurePath(query, path) {

    var pathParts = path.split('/');
    var currentPath = '';
    var exists = true;

    pathParts.forEach(function(pathPart) {
        currentPath += (currentPath ? '/' : '') + pathPart;
        if (!exists || !(exists = (query.getNodes(currentPath).length > 0)))
            createNodes(query, currentPath);
    });
}

function clearNodes(query) {
    query.forEach(function(x) { xml.clearChildNodes(x); });
}

function removeNodes(query) {
    query.forEach(function(x) { xml.removeNode(x); });
}

function openXmlFile(path, encoding) {
    encoding = encoding || 'utf8';
    var document = loadXml(fs.readFileSync(path, encoding));
    document.save = function() {
        fs.writeFileSync(path, document.toString(), encoding);
    };
    return document;
}

function loadXml(source) {
    var document = xmlParser.parseFromString(source);
    var trailingSpaces = TRAILING_SPACES_REGEX.exec(source)[0];
    var basePath, namespaces, errorOnNoMatches;

    var query = function(path, errorOnNoMatches, addIfMissing, alwaysAdd) {
        return queryNodes(
            buildQuery(document, namespaces),
            xml.joinXPath(basePath, path),
            errorOnNoMatches, addIfMissing, alwaysAdd);
    };

    var setValues = function(values, namespaces, errorOnNoMatches, addIfMissing, alwaysAdd) {
        _.forOwn(values, function(value, path) {
            setNodeValues(namespaces, query(path,
                errorOnNoMatches, addIfMissing, alwaysAdd), value);
        });
    };

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

        errorOnNoMatches: function() {
            errorOnNoMatches = true;
            return dsl;
        },

        clear: function(path) {
            clearNodes(query(path, errorOnNoMatches));
            return dsl;
        },

        remove: function(path) {
            removeNodes(query(path));
            return dsl;
        },

        set: function() {
            setValues(Args(arguments).toObject(), namespaces, errorOnNoMatches, false, false);
            return dsl;
        },

        ensure: function(path) {
            ensurePath(buildQuery(document, namespaces), basePath ? xml.joinXPath(basePath, path) : path);
            return dsl;
        },

        add: function() {
            setValues(Args(arguments).toObject(), namespaces, errorOnNoMatches, true, true);
            return dsl;
        },

        setOrAdd: function() {
            setValues(Args(arguments).toObject(), namespaces, errorOnNoMatches, true, false);
            return dsl;
        },

        XmlString: function(value) {
            return new xml.XmlString(value);
        },

        CDataValue: function(value) {
            return new xml.CDataValue(value);
        },

        toString: function() {
            var s = xmlSerializer.serializeToString(document);
            return s.replace(TRAILING_SPACES_REGEX, trailingSpaces);
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
