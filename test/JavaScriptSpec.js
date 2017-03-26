define(function JavaScriptSpec(require) {
    "use strict";

    var Parser = require("lexers/JSParser");

    describe("JS Parser", function () {
        it("detects a function declarations and expressions", function () {
            var test = require("text!example/javascript/function.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "public",
                    name: "a",
                    args: [],
                    level: 0,
                    line: 1
                }, {
                    type: "public",
                    name: "b",
                    args: [],
                    level: 0,
                    line: 3
                }, {
                    type: "public",
                    name: "d",
                    args: [],
                    level: 0,
                    line: 5
                }
            ]);
        });

        it("detects an unnamed function", function () {
            var test = require("text!example/javascript/unnamedFunction.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "unnamed",
                    name: "function",
                    args: [],
                    level: 0,
                    line: 1
                }
            ]);
        });

        it("detects a class and class methods", function () {
            var test = require("text!example/javascript/classMethod.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "class",
                    name: "Name",
                    args: [],
                    level: 0,
                    line: 1
                }, {
                    type: "public",
                    name: "getString",
                    args: [],
                    level: 0,
                    line: 3
                }, {
                    type: "private",
                    name: "_getPrivateString",
                    args: [],
                    level: 0,
                    line: 5
                }
            ]);
        });

        it("detects function parameters", function () {
            var test = require("text!example/javascript/functionParameters.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "public",
                    name: "withParameters",
                    args: ["a", "b"],
                    level: 0,
                    line: 1
                }, {
                    type: "public",
                    name: "withDefaultParameters",
                    args: ["a=1", "b=" + Parser.ARG_DEFAULT_PLACEHOLDER],
                    level: 0,
                    line: 3
                }
            ]);
        });

        it("detects ES6 functions", function () {
            var test = require("text!example/javascript/ES6.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "public",
                    name: "one",
                    args: [],
                    level: 0,
                    line: 2
                }, {
                    type: "public",
                    name: "two",
                    args: [],
                    level: 0,
                    line: 3
                }, {
                    type: "public",
                    name: "three",
                    args: [],
                    level: 0,
                    line: 4
                }
            ]);
        });

        it("detects generator functions", function () {
            var test = require("text!example/javascript/generator.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "generator",
                    name: "generator",
                    args: ["i"],
                    level: 0,
                    line: 1
                }
            ]);
        });

        it("detects nested functions", function () {
            var test = require("text!example/javascript/nestedFunctions.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "public",
                    name: "a",
                    args: [],
                    level: 0,
                    line: 1
                }, {
                    type: "public",
                    name: "b",
                    args: [],
                    level: 1,
                    line: 2
                }, {
                    type: "public",
                    name: "c",
                    args: [],
                    level: 2,
                    line: 3
                }
            ]);
        });

        it("detects es6 classes", function () {
            var test = require("text!example/javascript/class.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "class",
                    name: "Class",
                    args: [],
                    level: 0,
                    line: 1
                }, {
                    type: "public",
                    name: "method",
                    args: ["argument"],
                    level: 1,
                    line: 2
                }, {
                    type: "public",
                    name: "field",
                    args: [],
                    level: 1,
                    line: 3
                }, {
                    type: "public",
                    name: "field",
                    args: ["value"],
                    level: 1,
                    line: 4
                }, {
                    type: "class",
                    name: "SubClass",
                    args: ["SuperClass"],
                    level: 0,
                    line: 7
                }
            ]);
        });

        it("detects callback functions", function () {
            var test = require("text!example/javascript/callback.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "unnamed",
                    name: "function",
                    args: [],
                    level: 0,
                    line: 1
                }, {
                    type: "unnamed",
                    name: "function",
                    args: [],
                    level: 0,
                    line: 2
                }
            ]);
        });

        it("works with ES6 modules", function () {
            var test = require("text!example/javascript/es6-modules.js");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "public",
                    name: "doStuff",
                    args: [],
                    level: 0,
                    line: 3
                }
            ]);
        });

        it("detects comments", function () {
            var test = require("text!example/javascript/comment.js");
            var result = Parser.parse(test);
            expect(result).toEqual([]);
        });

        it("error", function () {
            var test = require("text!example/javascript/error.js");
            expect(function () {
                Parser.parse(test);
            }).toThrowError("SyntaxError");
        });
    });
});
