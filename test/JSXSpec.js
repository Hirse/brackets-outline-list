define(function JavaScriptSpec(require) {
    "use strict";

    var Parser = require("lexers/JSParser");

    describe("JSX Parser", function () {
        it("detects a function with JSX", function () {
            var test = require("text!example/jsx/test.jsx");
            var result = Parser.parse(test);

            expect(result.length).toEqual(1);

            expect(result[0].args.length).toEqual(0);
            expect(result[0].level).toEqual(0);
            expect(result[0].line).toEqual(1);
            expect(result[0].name).toEqual("a");
            expect(result[0].type).toEqual("public");
        });
    });
});
