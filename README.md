# xmlpoke

[![npm version](http://img.shields.io/npm/v/xmlpoke.svg?style=flat)](https://npmjs.org/package/xmlpoke) [![build status](http://img.shields.io/travis/mikeobrien/node-xmlpoke.svg?style=flat)](https://travis-ci.org/mikeobrien/node-xmlpoke) [![Dependency Status](http://img.shields.io/david/mikeobrien/node-xmlpoke.svg?style=flat)](https://david-dm.org/mikeobrien/node-xmlpoke) [![npm downloads](http://img.shields.io/npm/dm/xmlpoke.svg?style=flat)](https://npmjs.org/package/xmlpoke)

Node module for modifying XML files. Inspired by [NAnt XmlPoke](http://nant.sourceforge.net/release/0.92/help/tasks/xmlpoke.html).

## Install

```bash
$ npm install xmlpoke --save
```

## Usage

The xmlpoke module exports a function that modifies xml files:

`xmlpoke(path1, [path2], [...], [pathMap], modify)`

Or modifies an xml string:

`xmlpoke(xml, modify)`

#### Paths

Paths are [globs](https://github.com/isaacs/node-glob) and can be any combination of strings, objects with a property that contains the path, or arrays of those. By default, objects are assumed to have a `path` property (Although this can be overridden). Here are some examples of valid path input: 

```js
var xmlpoke = require('xmlpoke');

xmlpoke('**/*.xml', ...);

xmlpoke('**/*.xml', '**/*.config', ...);

xmlpoke([ '**/*.xml', '**/*.config' ], ...);

xmlpoke([ '**/*.xml', '**/*.config' ], { path: '*.proj' }, ...);

xmlpoke([ '**/*.xml', { path: '*.proj' } ], '**/*.config', ...);

xmlpoke([ 'data/*.xml', { path: '*.proj' } ], [ '**/*.config', { path: '*.xml' } ], ...);
```

As noted earlier, path objects are expected to have a `path` property. If you would like to override that you can pass in a function, *after* your paths, that map the path:

```js
var projects = [ 
    { 
        path: '/some/path', 
        config: 'app.config' 
    }, 
    ... 
];

xmlpoke(projects, function(p) { return path.join(p.path, p.config); }, ...);
```  

#### Modification

The last argument is a function that performs the modifications. This function is passed a DSL for manipulating the xml file.

```js
xmlpoke('**/*.config', function(xml) { 
    xml.set('data/connString', 'server=oh;db=hai');
});

var xml = xmlpoke('<oh/>', function(xml) { 
    xml.set('oh', 'hai');
});
```

Path objects, when supplied, are passed in the second argument:

```js
var projects = [ 
    { 
        path: 'app.config', 
        version: '1.2.3.4' 
    }, 
    ... 
];

xmlpoke(projects, function(xml, project) { 
    xml.set('app/version', project.version);
});
```

##### Clearing Child Nodes

You can clear the children of all matching nodes with the `clear()` method:

```js
xmlpoke('**/*.config', function(xml) { 
    xml.clear('some/path');
});
```

The `errorOnNoMatches` option will cause this method to throw an exception if the specified XPath yields no results.

##### Removing Nodes

You can remove all matching nodes with the `remove()` method:

```js
xmlpoke('**/*.config', function(xml) { 
    xml.remove('some/path');
});
```

The `errorOnNoMatches` option *does not* cause this method to throw an exception if the specified XPath yields no results.

##### Ensuring the Existence of Elements

You can ensure the existence of elements with the `ensure(xpath)` method. This method will create the entire path. In order to do this the path must contain only elements. It must not contain any axis specifiers. Element axes can have a predicate that compares the *equality* of one or more attributes or elements with a *string* value. Only the `=` comparison operator and `and` logical operators are allowed. If these predicates are specified, and the element does not exist, the predicate values will be set in the new element. Any predicates that do not meet these exact requirements are ignored. The following are examples of acceptable XPaths and the resulting xml when the source is `<el1/>`:

```js
ensure('el1/el2/el3');
```
```xml
<el1>
    <el2>
        <el3/>
    </el2>
</el1>
```
```js
ensure("el1/el2[@attr1='1' and @attr2='2']/el3[el4='3']");
```
```xml
<el1>
    <el2 attr1="1" attr2="2">
        <el3>
            <el4>3</el4>
        </el3>
    </el2>
</el1>
```

##### Setting Values and Content

You can set the values or content of all matching nodes with the `set()`, `add()` and `setOrAdd()` methods. These methods take an XPath and a value or an object with XPath and value properties:

`set([xpath, value]|[object])`

`add([xpath, value]|[object])`

`setOrAdd([xpath, value]|[object])`

```js
xmlpoke('**/*.config', function(xml) { 
    xml.set('some/path', 'value')
       .add('some/path', 'value')
       .setOrAdd('some/path', 'value')
       .set({ 'first/path': 'value1', 'second/path': 'value2' })
       .add({ 'first/path': 'value1', 'second/path': 'value2' })
       .setOrAdd({ 'first/path': 'value1', 'second/path': 'value2' });
});
```

The `set()` method expects all elements and attributes in the XPath to exist. If they do not, they will be ignored by default. To throw an exception specify the `errorOnNoMatches` option.

The `add()` method will create a new target node regardless of if there is a match. As such, this method is not very useful for attributes unless you are sure it doesn't already exist. On the other hand the `setOrAdd()` method will attempt to create the node if it doesn't exist, then set its value or content. *This will not create the entire XPath as `ensure()` does, only the target element or attribute i.e. the last node in the XPath query.* So the parent XPath must exist otherwise it will be ignored by default (To instead throw an exception, specify the `errorOnNoMatches` option). To be created, the target must be an attribute or an element. Element XPaths can have a predicate that compares the *equality* of one or more attributes or elements with a *string* value. Only the `=` comparison operator and `and` logical operators are allowed. If these predicates are specified, and the element does not exist, the predicate values will be set in the new element. Any predicates that do not meet these exact requirements are ignored. The following are examples of acceptable XPaths and the resulting xml when the source is `<el1/>`:

```js
setOrAdd('el1/@attr', 'value');
```
```xml
<el1 attr="value"/>
```
```js
setOrAdd('el1/el2', 'value');
```
```xml
<el1>
    <el2>value</el2>
</el1>
```
```js
setOrAdd("el1[el2='value1']/el3[@attr1='value2' and @attr2='value3']", 'value4');
```
```xml
<el1>
    <el2>value1</el2>
    <el3 attr1="value2" attr2="value3">value4</el3>
</el1>
```

Values can be strings, CData, raw xml, a function or an object containing multiple attribute and element values. For example:

```js
xmlpoke('**/*.config', function(xml) { 

    // Simple string value
    xml.set('some/path', 'value');

    // CData value
    xml.set('some/path', xml.CDataValue('value'));

    // Raw xml
    xml.set('some/path', xml.XmlString('<el attr="value">hai</el>'));

    // Function
    xml.set('some/path', function(node, value) { return 'value'; });

    // XPath and object with element and attribute values
    xml.set('some/path', {
        '@attr': 'value',
        el1: 'value',
        el2: xml.CDataValue('value'),
        el3: xml.XmlString('<el attr="oh">hai</el>'),
        el4: function(node, value) { return 'value'; }
    });

    // Object
    xml.set({
        'some/path/@attr': 'value',
        'some/path/el1': 'value',
        'some/path/el2': xml.CDataValue('value'),
        'some/path/el3': xml.XmlString('<el attr="value">hai</el>'),
        'some/path/el4': function(node, value) { return 'value'; },
        'some/path/el5': {
                '@attr': 'value',
                el1: 'value',
                el2: xml.CDataValue('value'),
                el3: xml.XmlString('<el attr="oh">hai</el>'),
                el4: function(node, value) { return 'value'; }
            }
        });
});
```

The `CDataValue()` and `XmlString()` methods exposed by the DSL are simply convenience methods for creating `CDataValue` and `XmlString` objects. These constructors are defined on the module and can be created directly as follows:

```js
var xmlpoke = require('xmlpoke');

var cdata = new xmlpoke.CDataValue('value');
var xmlstring = new xmlpoke.XmlString('<el attr="value">hai</el>');

xmlpoke('**/*.config', function(xml) { 
    xml.set('some/path', cdata);
    xml.set('some/path', xmlstring);
});
```

#### Options

##### Base XPath

A base XPath can be specified so you do not have to specify the full XPath in following calls:

```js
xmlpoke('**/*.config', function(xml) { 
    xml.withBasePath('configuration/appSettings')
       .set("add[@name='key1']", 'value1')
       .set("add[@name='key2']", 'value2');
});
```

##### Namespaces

Namespaces can be registered as follows:

```js
xmlpoke('**/*.config', function(xml) { 
    xml.addNamespace('y', 'uri:oh')
       .addNamespace('z', 'uri:hai')
       .set("y:config/z:value", 'value');
});
```

##### Empty Results

By default, XPaths that do not yield any results are quietly ignored. To throw an exception instead, you can configure as follows: 

```js
xmlpoke('**/*.config', function(xml) { 
    xml.errorOnNoMatches()
    ...;
});
```

## License
MIT License
