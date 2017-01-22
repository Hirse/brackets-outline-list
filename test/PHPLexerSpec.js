define(function (require) {
    "use strict";

    var Lexer = require("lexers/PHPLexer");

    describe("PHP Lexer", function () {
        it("detects a single function without arguments", function () {
            var test = require("text!example/php/function.php");
            var result = Lexer.parse(test);
            expect(result.length).toEqual(1);
            expect(result[0].args.length).toEqual(0);
            expect(result[0].isStatic).toEqual(false);
            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("myFunc");
            expect(result[0].type).toEqual("function");
        });

        it("detects a function in a class", function () {
            var test = require("text!example/php/class_method.php");
            var result = Lexer.parse(test);
            expect(result.length).toEqual(2);

            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("::myClass");
            expect(result[0].type).toEqual("class");

            expect(result[1].args.length).toEqual(0);
            expect(result[1].isStatic).toEqual(false);
            expect(result[1].line).toEqual(2);
            expect(result[1].name).toEqual("myClass::myFunc");
            expect(result[1].type).toEqual("function");
            expect(result[1].modifier).toEqual("private");
        });

        it("detects function arguments declared on seperate lines", function () {
            var test = require("text!example/php/arguments_newlines.php");
            var result = Lexer.parse(test);
            expect(result.length).toEqual(2);

            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("::myClass");
            expect(result[0].type).toEqual("class");

            expect(result[1].args.length).toEqual(2);
            expect(result[1].isStatic).toEqual(false);
            expect(result[1].line).toEqual(2);
            expect(result[1].name).toEqual("myClass::myFunc");
            expect(result[1].type).toEqual("function");
        });

        it("detects comments", function () {
            var test = require("text!example/php/comment.php");
            var result = Lexer.parse(test);
            expect(result.length).toEqual(0);
        });

        it("detects inheritance", function () {
            var test = require("text!example/php/inheritance.php");
            var result = Lexer.parse(test);
            expect(result).toEqual([
                {
                    type: "class",
                    name: "::Child::IChild",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 1
                }, {
                    type: "function",
                    name: "Child::speak",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 2
                }, {
                    type: "class",
                    name: "::Child::BaseChild",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 5
                }, {
                    type: "function",
                    name: "Child::speak",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 6
                }, {
                    type: "class",
                    name: "::Child::BaseChild::IChild",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 9
                }, {
                    type: "function",
                    name: "Child::speak",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 10
                }, {
                    type: "class",
                    name: "::Child::IChild::IChild2",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 13
                }, {
                    type: "function",
                    name: "Child::speak",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 14
                }
            ]);
        });
    });

    describe("PHP Lexer issues", function () {
        it("73 - ignores 'class' when used in html", function () {
            var test = require("text!example/php/73-html_class.php");
            var result = Lexer.parse(test);
            expect(result).toEqual([
                {
                    type: "function",
                    name: "_flow",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 1
                }, {
                    type: "function",
                    name: "ProcessAction",
                    args: ["$vars"],
                    modifier: "public",
                    isStatic: false,
                    line: 6
                }
            ]);
        });

        it("74 - ignores 'class' when used in require", function () {
            var test = require("text!example/php/74-require_class.php");
            var result = Lexer.parse(test);
            expect(result).toEqual([
                {
                    type: "class",
                    name: "::LogHelper",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 6
                }, {
                    type: "function",
                    name: "LogHelper::LogToDB",
                    args: ["$param1", "$param2", "$param3", "$param4"],
                    modifier: "public",
                    isStatic: true,
                    line: 8
                }
            ]);
        });

        it("76 - detects the abstract keyword", function () {
            var test = require("text!example/php/76-abstract.php");
            var result = Lexer.parse(test);
            expect(result).toEqual([
                {
                    type: "class",
                    name: "::BaseAdapter",
                    args: [],
                    modifier: "public",
                    isStatic: false,
                    line: 1
                }, {
                    type: "function",
                    name: "BaseAdapter::__construct",
                    args: [],
                    modifier: "protected",
                    isStatic: false,
                    line: 2
                }, {
                    type: "function",
                    name: "BaseAdapter::insertAlias",
                    args: ["$alias", "$ormizer_id", "$referenced_table"],
                    modifier: "public",
                    isStatic: false,
                    line: 12
                }, {
                    type: "function",
                    name: "BaseAdapter::castColumns",
                    args: ["$columns_array"],
                    modifier: "protected",
                    isStatic: false,
                    line: 14
                }
            ]);
        });
    });
});
