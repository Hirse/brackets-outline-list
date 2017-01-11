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
            .addRule(/public|protected|private/, function (w) {
                modifier = w;
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
                        isStatic: false,
                        line: line
                    });
                }
            })
            // when it encounters `class` and literal mode is off.
            // 1. push "class" into state array.
            // 2. create a class structure into results array.
            .addRule(/class/, function () {
                if (!literal && !comment) {
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
            // if it's a variable and it's in function args semantics, push it into args array.
            .addRule(/\$[a-zA-Z_]+/, function (w) {
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
            .addRule(/[a-zA-Z_]+/, function (w) {
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
                    if (s === "function" || s === "class") {
                        ns.pop();
                    }
                }
            })
            // other terms are ignored.
            .addRule(/./, ignored)
            // line number increases.
            .addRule(/\r?\n/, function () {
                line += 1;
            });
        // parse the code to the end of the source.
        source = source.split('\n');
        for (var i =0, l = source.length; i<l; i++) {
            lexer.setInput(source[i]);
            lexer.lex();
        }
        return results;
    }

    module.exports = {
        parse: parse
    };
});
