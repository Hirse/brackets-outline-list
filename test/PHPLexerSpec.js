define([
    "lexers/PHPLexer",
    "text!example/php/test1.php",
    "text!example/php/test2.php"
], function (Lexer, test1, test2) {
    "use strict";

    describe("PHP Lexer", function () {
        it("detects a single function without arguments", function () {
            var result = Lexer.parse(test1);
            expect(result.length).toEqual(1);
            expect(result[0].args.length).toEqual(0);
            expect(result[0].isStatic).toEqual(false);
            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("foo");
            expect(result[0].type).toEqual("function");
        });

        it("detects a function in a class", function () {
            var result = Lexer.parse(test2);
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
    });
});
