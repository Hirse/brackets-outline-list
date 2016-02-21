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
    });
});
