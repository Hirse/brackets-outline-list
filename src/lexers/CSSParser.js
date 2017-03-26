define(function CSSParser(require, exports, module) {
    "use strict";

    var postcss = require("thirdparty/postcss-safe-parser");

    /**
     * Get the type based on the selector.
     * @private
     * @param   {string} selector CSS selector.
     * @returns {string} CSS outline entry type.
     */
    function _getType(selector) {
        var classes = {
            "#": "id",
            ".": "class",
            "[": "attribute",
            "&": "parent"
        };
        return classes[selector[0]] || "tag";
    }

    /**
     * Replace whitespace with a single space.
     * @param   {string} string String potentially containing multiple whitespace.
     * @returns {string} Normalized string.
     */
    function _normalize(string) {
        return string.replace(/\s+/g, " ");
    }

    /**
     * Visit a node in the CSS AST and its children recursively.
     * Add the parsed entries to the given result array.
     * @private
     * @param {object[]} result List of parsed entries.
     * @param {object}   node   Current CSS AST node.
     * @param {number}   level  Depth of the node in the tree.
     */
    function _visit(result, node, level) {
        if (node.type === "rule") {
            result.push({
                name: _normalize(node.selector),
                type: _getType(node.selector),
                level: level,
                line: node.source.start.line - 1,
                ch: node.source.start.column - 1
            });
        } else if (node.type === "atrule") {
            result.push({
                name: _normalize("@" + node.name + " " + node.params),
                type: "at-rule",
                level: level,
                line: node.source.start.line - 1,
                ch: node.source.start.column - 1
            });
        }
        if (node.each) {
            node.each(function (child) {
                _visit(result, child, level + 1);
            });
        }
    }

    /**
     * Parse the source and extract the code structure.
     * @param   {string}   source the source code.
     * @returns {object[]} the code structure.
     */
    function parse(source) {
        var result = [];
        var ast = postcss(source);
        ast.each(function (node) {
            _visit(result, node, 0);
        });
        return result;
    }

    module.exports = {
        parse: parse
    };
});
