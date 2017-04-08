define(function JSParser(require, exports, module) {
    "use strict";

    var espree = require("thirdparty/espree");

    /** @const {string} Placeholder for unnamed functions. */
    var UNNAMED_PLACEHOLDER = "function";

    /** @const {string} Placeholder for argument default values. */
    var ARG_DEFAULT_PLACEHOLDER = "{⋯}";

    /**
     * Parse an array of Identifier nodes and the corresponding default values.
     * @private
     * @param   {(Indetifier|AssignmentPattern)[]} args List of params
     * @returns {string[]}                         List of parsed strings for the arguments.
     */
    function _parseArgs(args) {
        return args.map(function (arg) {
            if (arg.type === "Identifier") {
                return arg.name;
            } else if (arg.type === "AssignmentPattern") {
                if (arg.right.type === "Literal") {
                    return arg.left.name + "=" + arg.right.raw;
                } else {
                    return arg.left.name + "=" + ARG_DEFAULT_PLACEHOLDER;
                }
            } else {
                return "";
            }
        });
    }

    /**
     * Visit a node in the ast.
     * If it is a node representing a function, return an object.
     * If it is a node which can be the name of a following function, return a string.
     * @private
     * @param   {object}         node  AST node
     * @param   {string}         name  Name of a previous node
     * @param   {number}         level Indentation level of the function
     * @returns {object|boolean} Parsed function object, or name
     */
    function _visit(node, name, level) {
        if (node.type === "ClassDeclaration") {
            return {
                name: node.id.name,
                line: node.loc.start.line,
                type: "class",
                level: level,
                args: node.superClass ? [node.superClass.name] : []
            };
        }
        if (node.params) {
            name = node.id ? node.id.name : name || UNNAMED_PLACEHOLDER;
            var type;
            if (node.generator) {
                type = "generator";
            } else if (name === UNNAMED_PLACEHOLDER) {
                type = "unnamed";
            } else if (name[0] === "_") {
                type = "private";
            } else if (name[0] === name[0].toUpperCase()) {
                type = "class";
            } else {
                type = "public";
            }
            return {
                name: name,
                line: node.loc.start.line,
                type: type,
                level: level,
                args: _parseArgs(node.params, node.defaults)
            };
        }
        switch (node.type) {
            case "VariableDeclarator":
                return node.id.name;
            case "ExpressionStatement":
                if (node.expression.left) {
                    if (node.expression.left.name) {
                        return node.expression.left.name;
                    } else if (node.expression.left.property && node.expression.left.property.name) {
                        return node.expression.left.property.name;
                    }
                }
                return false;
            case "Property":
                return node.key.name;
            case "MethodDefinition":
                return node.key.name;
            default:
                return false;
        }
    }

    /**
     * Traverse a subtree recursivly.
     * @private
     * @param   {object}   node  AST node
     * @param   {object[]} list  List of objects for the parsed nodes
     * @param   {string}   name  Name of a previous node
     * @param   {number}   level Indentation level of the function
     * @returns {object[]} List of objects for the parsed nodes
     */
    function _traverse(node, list, name, level) {
        if (node && typeof node.type === "string") {
            var res = _visit(node, name, level);
            if (typeof res === "string") {
                name = res;
            } else if (typeof res === "object") {
                list.push(res);
                level++;
            }

            for (var prop in node) {
                // Skip if property name starts with "$"
                if (prop[0] === "$") {
                    continue;
                }

                var child = node[prop];

                if (Array.isArray(child)) {
                    for (var i = 0; i < child.length; i++) {
                        list = _traverse(child[i], list, "", level);
                    }
                } else {
                    list = _traverse(child, list, name, level);
                }
            }
        }
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
            ast = espree.parse(source, {
                loc: true,
                ecmaVersion: 8,
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true
                }
            });
        } catch (error) {
            throw new Error("SyntaxError");
        }

        var result = _traverse(ast, [], "", 0);
        return result;
    }

    module.exports = {
        parse: parse,
        UNNAMED_PLACEHOLDER: UNNAMED_PLACEHOLDER,
        ARG_DEFAULT_PLACEHOLDER: ARG_DEFAULT_PLACEHOLDER
    };
});
