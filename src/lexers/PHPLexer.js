define(function PHPLexer(require, exports, module) {
    "use strict";

    var phpParser = require("thirdparty/php-parser");

    /** @const {string} Placeholder for unnamed functions. */
    var UNNAMED_PLACEHOLDER = "function";

    /**
     * Parse a Parameter node.
     * @private
     * @param   {object} argument Parameter node
     * @returns {string} String representation of the Parameter.
     */
    function _parseArg(argument) {
        return "$" + argument.name;
    }

    /**
     * Traverse a subtree recursivly.
     * @private
     * @param   {object}   node  AST node
     * @param   {object[]} list  List of objects for the parsed nodes
     * @param   {number}   level Indentation level of the function
     * @returns {object[]} List of objects for the parsed nodes
     */
    function _traverse(node, list, level) {
        if (node.kind === "class") {
            list.push({
                type: "class",
                name: node.name,
                args: [],
                modifier: "public",
                level: level,
                isStatic: false,
                line: node.loc.start.line - 1
            });
            level++;
        } else if (node.kind === "function") {
            list.push({
                type: "function",
                name: node.name,
                args: node.arguments.map(_parseArg),
                modifier: "public",
                level: level,
                isStatic: false,
                line: node.loc.start.line - 1
            });
            level++;
        } else if (node.kind === "method") {
            list.push({
                type: "function",
                name: node.name,
                args: node.arguments.map(_parseArg),
                modifier: node.visibility,
                level: level,
                isStatic: node.isStatic,
                line: node.loc.start.line - 1
            });
            level++;
        } else if (node.kind === "closure") {
            list.push({
                type: "function",
                name: UNNAMED_PLACEHOLDER,
                args: node.arguments.map(_parseArg),
                modifier: "unnamed",
                level: level,
                isStatic: false,
                line: node.loc.start.line - 1
            });
            level++;
        }
        Object.keys(node).forEach(function (prop) {
            var children = node[prop];
            if (Array.isArray(children)) {
                children.forEach(function (child) {
                    list = _traverse(child, list, level);
                });
            } else if (children instanceof Object) {
                list = _traverse(children, list, level);
            }
        });
        return list;
    }

    /**
     * Parse the source and extract the code structure.
     * @param   {string}   source the source code.
     * @returns {object[]} the code structure.
     */
    function parse(source) {
        var ast;
        try {
            ast = phpParser.parseCode(source, {
                parser: {
                    locations: true,
                    suppressErrors: true
                },
                ast: {
                    withPositions: true
                }
            });
        } catch (error) {
            throw new Error("SyntaxError");
        }

        var result = _traverse(ast, [], 0);
        return result;
    }

    module.exports = {
        parse: parse
    };
});
