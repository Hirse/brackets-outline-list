define(function (require, exports, module) {
    "use strict";

    // use lexer from thirdparty.
    var Lexer = require("thirdparty/lexer");

    var unnamedPlaceholder = "function";

    /**
     * Parse the source and extract the code structure.
     *
     * @param   {Array} source the source code.
     * @returns {Array} the code structure.
     */
    function parse(source) {
        var line = 0; // line number.
        var ns = []; // the namespace array.
        var literal = true; // check if it's in literal area.
        var state = []; // the state array.
        // helper function to peek an item from an array.
        var peek = function (a) {
            if (a.length > 0) {
                return a[a.length - 1];
            }
            return null;
        };
        var results = [];
        var ignored = function () {};
        var lexer = new Lexer();
        lexer
        // when it encounters `<?php` structure, turn off literal mode.
            .addRule(/\<\?(php)?/, function () {
                literal = false;
            })
            // when it encounters `?>` structure, turn on literal mode.
            .addRule(/\?\>/, function () {
                literal = true;
            })
            // when it encounters `function` and literal mode is off,
            // 1. push 'function' into state array;
            // 2. push a function structure in result.
            .addRule(/function/, function () {
                if (!literal) {
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
                if (!literal) {
                    state.push("class");
                    results.push({
                        type: "class",
                        name: ns.join("::"),
                        args: [],
                        modifier: "public",
                        isStatic: false,
                        line: line
                    });
                }
            })
            // if it's a variable and it's in function args semantics, push it into args array.
            .addRule(/\$[a-zA-Z_]+/, function (w) {
                if (peek(state) === "args") {
                    peek(results).args.push(w);
                }
            })
            // check if it's an identity term.
            .addRule(/[a-zA-Z_]+/, function (w) {
                var ref;
                if (!literal) {
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
                            // TODO: all function are assumed to be public.
                            ref.modifier = "public";
                            break;
                        case "class":
                            ns.push(w);
                            ref = peek(results);
                            ref.name += "::" + w;
                            break;
                        default:
                            break;
                    }
                }
            })
            // check if it's in function definition, turn on args mode.
            .addRule(/\(/, function () {
                if (peek(state) === "function") {
                    var ref = peek(results);
                    if (!ref || ref.type !== "function") {
                        ns.push(unnamedPlaceholder);
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
            })
            // turn off args mode.
            .addRule(/\)/, function () {
                if (peek(state) === "args") {
                    state.pop();
                }
            })
            // start function/class body definition or scoped code structure.
            .addRule(/{/, function () {
                var prefix;
                var ref;
                if (!literal) {
                    if ((ref = peek(state)) === "function" || ref === "class") {
                        prefix = state.pop();
                        state.push(prefix + ":start");
                    } else {
                        state.push("start");
                    }
                }
            })
            // pop name from namespace array if it's in a namespace.
            .addRule(/}/, function () {
                var s;
                if (!literal && state.length > 0) {
                    s = state.pop().split(":")[0];
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
        lexer.setInput(source);
        // parse the code to the end of the source.
        while (lexer.index < source.length - 1) {
            lexer.lex();
        }
        return results;
    }

    module.exports = {
        parse: parse
    };
});
