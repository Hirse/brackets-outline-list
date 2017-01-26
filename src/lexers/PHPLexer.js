define(function (require, exports, module) {
    "use strict";

    var Lexer = require("thirdparty/lexer");

    /** @const {string} Placeholder for unnamed functions. */
    var UNNAMED_PLACEHOLDER = "function";

    /**
     * Parse the source and extract the code structure.
     * @param   {string}   source the source code.
     * @returns {object[]} the code structure.
     */
    function parse(source) {
        var line = 0; // line number.
        var ns = []; // the namespace array.
        var literal = true; // check if it's in literal area.
        var comment = false; // the comment flag.
        var state = []; // the state array.
        var modifier = null; // the modifier.
        var isStatic = false; // static flag.
        var isAbstract = false; // abstract flag.
        // saves the results object of the last class that
        // extends another or implements an interface.
        var lastChildClass = null;
        // helper function to peek an item from an array.
        var peek = function (array) {
            if (array.length > 0) {
                return array[array.length - 1];
            }
            return null;
        };
        var results = [];
        var ignored = function () { /* noop */ };
        var lexer = new Lexer();
        lexer
            // when it encounters `<?php` structure, turn off literal mode.
            .addRule(/<\?(php)?/, function () {
                literal = false;
            })
            // when it encounters `?>` structure, turn on literal mode.
            .addRule(/\?>/, function () {
                literal = true;
            })
            // toggle comment if necessary.
            .addRule(/\/\*/, function () {
                comment = true;
            })
            .addRule(/\*\//, function () {
                comment = false;
            })
            // ignore the comments.
            .addRule(/\/\/[^\n]*/, ignored)
            // ignore strings (double quotes).
            .addRule(/"((?:\\.|[^"\\])*)"/, ignored)
            // ignore strings (single quotes).
            .addRule(/'((?:\\.|[^'\\])*)'/, ignored)
            // detect abstract modifier, but treat it apart from the visibility modifiers
            .addRule(/public|protected|private|abstract/, function (w) {
                if (w === "abstract") {
                    isAbstract = true;
                } else {
                    modifier = w;
                }
            })
            .addRule(/static/, function () {
                isStatic = true;
            })
            // when it encounters `function` and literal mode is off,
            // 1. push 'function' into state array;
            // 2. push a function structure in result.
            .addRule(/function/, function () {
                if (!literal && !comment) {
                    state.push("function");
                    results.push({
                        type: "function",
                        name: ns.join("::"),
                        args: [],
                        modifier: "unnamed",
                        isStatic: isStatic, // static functions did not appear in cursive (flag always false)
                        line: line
                    });
                }
            })
            // when it encounters `class` and literal mode is off.
            // 1. push "class" into state array.
            // 2. create a class structure into results array.
            .addRule(/class/, function () {
                if (!literal && !comment && ns.length === 0) {
                    state.push("class");
                    results.push({
                        type: "class",
                        name: ns.join("::"),
                        args: [],
                        modifier: "public",
                        isStatic: isStatic,
                        line: line
                    });
                }
            })
            // support for extended classes and interface implementations
            .addRule(/extends|implements/, function () {
                if (!literal && !comment) {
                    if (peek(state) === "class") {
                        lastChildClass = results.pop();
                        state.push("inheriting");
                    }
                }
            })
            // if it's a variable and it's in function args semantics, push it into args array.
            .addRule(/\$[0-9a-zA-Z_]+/, function (w) {
                if (!literal && !comment) {
                    if (peek(state) === "args") {
                        peek(results).args.push(w);
                    }
                    // reset modifiers when variable is parsed.
                    modifier = null;
                    isStatic = false;
                }
            })
            // check if it's an identity term.
            .addRule(/[0-9a-zA-Z_]+/, function (w) {
                var ref;
                if (!literal && !comment) {
                    switch (peek(state)) {
                        case "function":
                            ns.push(w);
                            ref = peek(results);
                            // if it's in name space scope.
                            if (ns.length > 1) {
                                ref.name += "::" + w;
                            } else {
                                ref.name = w;
                            }
                            ref.modifier = modifier || "public";
                            break;
                        case "class":
                            ns.push(w);
                            ref = peek(results);
                            ref.name += "::" + w;
                            break;
                        case "inheriting":
                            state.push("class");
                            results.push(lastChildClass);
                            ref = peek(results);
                            ref.name += "::" + w;
                            break;
                        default:
                            break;
                    }
                    // reset modifier when identity term is parsed.
                    modifier = null;
                    isStatic = false;
                }
            })
            // check if it's in function definition, turn on args mode.
            .addRule(/\(/, function () {
                if (!literal && !comment) {
                    if (peek(state) === "function") {
                        var ref = peek(results);
                        if (!ref || ref.type !== "function") {
                            ns.push(UNNAMED_PLACEHOLDER);
                            results.push({
                                type: "function",
                                name: ns.join("::"),
                                args: [],
                                modifier: "unnamed",
                                isStatic: false,
                                line: line
                            });
                        }
                        state.push("args");
                    }
                }
            })
            // turn off args mode.
            .addRule(/\)/, function () {
                if (!literal && !comment) {
                    if (peek(state) === "args") {
                        state.pop();
                    }
                }
            })
            // start function/class body definition or scoped code structure.
            .addRule(/{/, function () {
                if (!literal && !comment) {
                    var ref;
                    if ((ref = peek(state)) === "function" || ref === "class") {
                        var prefix = state.pop();
                        state.push(prefix + ":start");
                    } else {
                        state.push("start");
                    }
                }
            })
            // pop name from namespace array if it's in a namespace.
            .addRule(/}/, function () {
                if (!literal && !comment && state.length > 0) {
                    var s = state.pop().split(":")[0];
                    if (s === "class") {
                        ns.pop();
                    }
                    // support for anonymous functions within other functions
                    if (s === "function") {
                        var ref = peek(results);
                        if (ref.modifier === "unnamed") {
                            if (ns.length > 0) {
                                ref.name += "::";
                            }
                            ref.name += UNNAMED_PLACEHOLDER;
                            state.pop();
                            ns.pop();
                        } else {
                            ns.pop();
                        }
                    }
                }
            })
            // support for abstract methods
            .addRule(/;/, function () {
                if (!literal && !comment) {
                    if (peek(state) === "function" && isAbstract) {
                        ns.pop();
                        isAbstract = false; // reset abstract flag
                    } else if (peek(state) === "class") {
                        ns.pop();
                    }
                }
            })
            // support for classes implementing multiple interfaces
            .addRule(/,/, function () {
                if (!literal && !comment) {
                    if (peek(state) === "class") {
                        state.pop();
                        results.pop();
                    }
                }
            })
            // other terms are ignored.
            .addRule(/./, ignored);

        // parse the code to the end of the source.
        source.split(/\r?\n/).forEach(function (sourceLine) {
            lexer.setInput(sourceLine);
            lexer.lex();
            // line number increases.
            line += 1;
        });
        return results;
    }

    module.exports = {
        parse: parse
    };
});
