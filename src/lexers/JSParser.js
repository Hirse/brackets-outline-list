define(function (require, exports, module) {
    "use strict";

    var esprima = require("thirdparty/esprima");

    /** @const {string} Placeholder for unnamed functions. */
    var UNNAMED_PLACEHOLDER = "function";

    function _parseArgs(args, defaults) {
        return args.map(function (arg, i) {
            return arg.name + (defaults[i] ? "=" + defaults[i].value : "");
        });
    }

    function _visit(node, name) {
        if (node.params) {
            name = node.id ? node.id.name : name || UNNAMED_PLACEHOLDER;
            var type;
            if (node.generator) {
                type = "generator";
            } else if (name[0] === name[0].toUpperCase()) {
                type = "class";
            } else {
                type = "function";
            }
            return {
                name: name,
                line: node.loc.start.line,
                type: type,
                args: _parseArgs(node.params, node.defaults)
            };
        }
        switch (node.type) {
            case "VariableDeclarator":
                return node.id.name;
            case "ExpressionStatement":
                if (node.expression.left) {
                    return node.expression.left.name || node.expression.left.property.name;
                }
                break;
            case "Property":
                return node.key.name;
            default:
                return false;
        }
    }

    function _traverse(node, list, name) {
        if (node && typeof node.type === "string") {
            var res = _visit(node, name);
            if (typeof res === "string") {
                name = res;
            } else if (typeof res === "object") {
                list.push(res);
            }

            for (var prop in node) {
                // Skip if property name starts with "$"
                if (prop[0] === "$") {
                    continue;
                }

                var child = node[prop];

                if (Array.isArray(child)) {
                    for (var i = 0; i < child.length; i++) {
                        list = _traverse(child[i], list, name);
                    }
                } else {
                    list = _traverse(child, list, name);
                }
            }
        }
        return list;
    }

    function parse(source) {
        var ast = esprima.parse(source, {
            loc: true,
            tolerant: true
        });

        var result = _traverse(ast, []);
        return result;
    }

    module.exports = {
        parse: parse
    };
});
