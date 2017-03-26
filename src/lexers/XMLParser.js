define(function XMLParser(require, exports, module) {
    "use strict";

    var htmlparser = require("thirdparty/htmlparser2");
    var Promise = require("thirdparty/promise");

    /**
     * Get the location (line and column) for an index.
     * @param   {string} source The source code
     * @param   {number} index  Nesting level
     * @returns {object} Location with line and column
     */
    function _getLocation(source, index) {
        var loc = {
            line: 0,
            ch: 0
        };
        var count = 0;
        while (count < index) {
            if (source[count] === "\n") {
                loc.line++;
                loc.ch = 0;
            } else {
                loc.ch++;
            }
            count++;
        }
        return loc;
    }

    /**
     * Traverse the tree revcursively.
     * @param   {object[]} dom    List of dom node objects
     * @param   {string}   source The source code
     * @param   {number}   level  Nesting level
     * @returns {objct[]}  The code structure
     */
    function _traverse(dom, source, level) {
        return dom.reduce(function (result, entry) {
            if (entry.type === "tag") {
                // Skip eRuby tags
                if (entry.name.indexOf("%") === 0) {
                    return result.concat(_traverse(entry.children, source, level));
                }
                var loc = _getLocation(source, entry.startIndex);
                var classes = (entry.attribs.class || "").split(/ +/).filter(function (clazz) {
                    return clazz;
                });
                result.push({
                    name: entry.name.indexOf(":") === -1 ? entry.name : entry.name.split(":")[1],
                    namespace: entry.name.indexOf(":") === -1 ? "" : entry.name.split(":")[0],
                    level: level,
                    id: entry.attribs.id || "",
                    class: classes,
                    line: loc.line,
                    ch: loc.ch
                });
                return result.concat(_traverse(entry.children, source, level + 1));
            }
            return result;
        }, []);
    }

    /**
     * Parse the source and extract the code structure.
     * @param   {string}            source The source code.
     * @returns {Promise<object[]>} Promise of the code structure.
     */
    function parse(source) {
        return new Promise(function (resolve, reject) {
            var parser = new htmlparser.Parser(new htmlparser.DomHandler(function (error, dom) {
                if (error) {
                    reject(error);
                } else {
                    resolve(_traverse(dom, source, 0));
                }
            }, {
                withStartIndices: true,
                withEndIndices: true
            }));
            parser.write(source);
            parser.done();
        });
    }

    module.exports = {
        parse: parse
    };
});
