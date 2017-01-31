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
            expect(result[0].name).toEqual("myClass");
            expect(result[0].type).toEqual("class");
            expect(result[0].level).toEqual(0);

            expect(result[1].args.length).toEqual(0);
            expect(result[1].isStatic).toEqual(false);
            expect(result[1].line).toEqual(2);
            expect(result[1].name).toEqual("myFunc");
            expect(result[1].type).toEqual("function");
            expect(result[1].modifier).toEqual("private");
            expect(result[1].level).toEqual(1);
        });

        it("detects function arguments declared on seperate lines", function () {
            var test = require("text!example/php/arguments_newlines.php");
            var result = Lexer.parse(test);
            expect(result.length).toEqual(2);

            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("myClass");
            expect(result[0].type).toEqual("class");
            expect(result[0].level).toEqual(0);

            expect(result[1].args.length).toEqual(2);
            expect(result[1].isStatic).toEqual(false);
            expect(result[1].line).toEqual(2);
            expect(result[1].name).toEqual("myFunc");
            expect(result[1].type).toEqual("function");
            expect(result[1].level).toEqual(1);
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
                    name: "Child",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 1
                }, {
                    type: "function",
                    name: "speak",
                    args: [],
                    modifier: "public",
                    level: 1,
                    isStatic: false,
                    line: 2
                }, {
                    type: "class",
                    name: "Child",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 5
                }, {
                    type: "function",
                    name: "speak",
                    args: [],
                    modifier: "public",
                    level: 1,
                    isStatic: false,
                    line: 6
                }, {
                    type: "class",
                    name: "Child",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 9
                }, {
                    type: "function",
                    name: "speak",
                    args: [],
                    modifier: "public",
                    level: 1,
                    isStatic: false,
                    line: 10
                }
            ]);
        });

        it("detects multiple interfaces", function () {
            var test = require("text!example/php/multiple_interfaces.php");
            var result = Lexer.parse(test);
            expect(result).toEqual([
                {
                    type: "class",
                    name: "Child",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 1
                }, {
                    type: "function",
                    name: "speak",
                    args: [],
                    modifier: "public",
                    level: 1,
                    isStatic: false,
                    line: 2
                }
            ]);
        });

        it("detects anonymous functions, also within other functions", function () {
            var test = require("text!example/php/anonymous_functions.php");
            var result = Lexer.parse(test);
            expect(result).toEqual([
                {
                    type: "function",
                    name: "function",
                    args: ["$val"],
                    modifier: "unnamed",
                    level: 0,
                    isStatic: false,
                    line: 1
                }, {
                    type: "function",
                    name: "myFunc",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 5
                }, {
                    type: "function",
                    name: "function",
                    args: ["$val"],
                    modifier: "unnamed",
                    level: 1,
                    isStatic: false,
                    line: 6
                }, {
                    type: "class",
                    name: "MyClass",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 11
                }, {
                    type: "function",
                    name: "myFunc2",
                    args: [],
                    modifier: "public",
                    level: 1,
                    isStatic: false,
                    line: 12
                }, {
                    type: "function",
                    name: "function",
                    args: ["$val"],
                    modifier: "unnamed",
                    level: 2,
                    isStatic: false,
                    line: 13
                }, {
                    type: "function",
                    name: "myFunc3",
                    args: [],
                    modifier: "public",
                    level: 1,
                    isStatic: false,
                    line: 18
                }
            ]);
        });

        it("correctly returns the indentation level", function () {
            var test = require("text!example/php/indentation_levels.php");
            var result = Lexer.parse(test);
            expect(result).toEqual([
                {
                    type: "function",
                    name: "a",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 1
                }, {
                    type: "class",
                    name: "MyClass",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 3
                }, {
                    type: "function",
                    name: "b",
                    args: [],
                    modifier: "public",
                    level: 1,
                    isStatic: false,
                    line: 4
                }, {
                    type: "function",
                    name: "c",
                    args: [],
                    modifier: "public",
                    level: 2,
                    isStatic: false,
                    line: 5
                }, {
                    type: "function",
                    name: "function",
                    args: ["$val"],
                    modifier: "unnamed",
                    level: 3,
                    isStatic: false,
                    line: 6
                }, {
                    type: "function",
                    name: "d",
                    args: [],
                    modifier: "public",
                    level: 1,
                    isStatic: false,
                    line: 11
                }
            ]);
        });

        it("detects and ignore strings and execute operator", function () {
            var test = require("text!example/php/strings.php");
            var result = Lexer.parse(test);
            expect(result.length).toEqual(0);
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
                    level: 0,
                    isStatic: false,
                    line: 1
                }, {
                    type: "function",
                    name: "ProcessAction",
                    args: ["$vars"],
                    modifier: "public",
                    level: 0,
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
                    name: "LogHelper",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 6
                }, {
                    type: "function",
                    name: "LogToDB",
                    args: ["$param1", "$param2", "$param3", "$param4"],
                    modifier: "public",
                    level: 1,
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
                    name: "BaseAdapter",
                    args: [],
                    modifier: "public",
                    level: 0,
                    isStatic: false,
                    line: 1
                }, {
                    type: "function",
                    name: "__construct",
                    args: [],
                    modifier: "protected",
                    level: 1,
                    isStatic: false,
                    line: 2
                }, {
                    type: "function",
                    name: "insertAlias",
                    args: ["$alias", "$ormizer_id", "$referenced_table"],
                    modifier: "public",
                    level: 1,
                    isStatic: false,
                    line: 12
                }, {
                    type: "function",
                    name: "castColumns",
                    args: ["$columns_array"],
                    modifier: "protected",
                    level: 1,
                    isStatic: false,
                    line: 14
                }
            ]);
        });
    });
});
