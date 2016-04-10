define(function JavaScriptSpec(require) {
    "use strict";

    var Parser = require("lexers/JSParser");

    describe("JS Parser", function () {
        it("detects a single function class constructor", function () {
            var test = require("text!example/javascript/functionClass.js");
            var result = Parser.parse(test);
            expect(result.length).toEqual(1);
            expect(result[0].args.length).toEqual(0);
            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("Name");
            expect(result[0].type).toEqual("class");
        });

        it("detects a class method", function () {
            var test = require("text!example/javascript/classMethod.js");
            var result = Parser.parse(test);
            expect(result.length).toEqual(2);
            expect(result[0].args.length).toEqual(0);
            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("Name");
            expect(result[0].type).toEqual("class");
            expect(result[1].args.length).toEqual(0);
            expect(result[1].line).toEqual(3);
            expect(result[1].name).toEqual("getString");
            expect(result[1].type).toEqual("function");
        });

        it("detects function parameters", function () {
            var test = require("text!example/javascript/functionParameters.js");
            var result = Parser.parse(test);
            expect(result.length).toEqual(2);
            expect(result[0].args.length).toEqual(2);
            expect(result[0].args[0]).toEqual("a");
            expect(result[0].args[1]).toEqual("b");
            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("withParameters");
            expect(result[0].type).toEqual("function");
            expect(result[1].args.length).toEqual(2);
            expect(result[1].args[0]).toEqual("a=1");
            expect(result[1].args[1]).toEqual("b=2");
            expect(result[1].line).toEqual(3);
            expect(result[1].name).toEqual("withDefaultParameters");
            expect(result[1].type).toEqual("function");
        });

        it("detects ES6 functions", function () {
            var test = require("text!example/javascript/ES6.js");
            var result = Parser.parse(test);
            expect(result.length).toEqual(3);
            expect(result[0].args.length).toEqual(0);
            expect(result[0].line).toEqual(2);
            expect(result[0].name).toEqual("one");
            expect(result[0].type).toEqual("function");
            expect(result[1].args.length).toEqual(0);
            expect(result[1].line).toEqual(3);
            expect(result[1].name).toEqual("two");
            expect(result[1].type).toEqual("function");
            expect(result[2].args.length).toEqual(0);
            expect(result[2].line).toEqual(4);
            expect(result[2].name).toEqual("three");
            expect(result[2].type).toEqual("function");
        });

        it("detects generator functions", function () {
            var test = require("text!example/javascript/generator.js");
            var result = Parser.parse(test);
            expect(result.length).toEqual(1);
            expect(result[0].args.length).toEqual(1);
            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("generator");
            expect(result[0].type).toEqual("generator");
        });

        it("detects comments", function () {
            var test = require("text!example/javascript/comment.js");
            var result = Parser.parse(test);
            expect(result.length).toEqual(0);
        });
    });
});
