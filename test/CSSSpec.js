define(function CSSSpec(require) {
    "use strict";

    var Parser = require("lexers/CSSParser");

    describe("CSS Parser", function () {
        it("detects tag rules in CSS", function () {
            var test = require("text!example/css/tag.css");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "tag",
                    name: "a",
                    level: 0,
                    line: 0,
                    ch: 0
                }, {
                    type: "tag",
                    name: "a b",
                    level: 0,
                    line: 1,
                    ch: 0
                }
            ]);
        });

        it("detects class rules in CSS", function () {
            var test = require("text!example/css/class.css");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "class",
                    name: ".a",
                    level: 0,
                    line: 0,
                    ch: 0
                }, {
                    type: "class",
                    name: ".a .b",
                    level: 0,
                    line: 1,
                    ch: 0
                }, {
                    type: "class",
                    name: ".a.b",
                    level: 0,
                    line: 2,
                    ch: 0
                }
            ]);
        });

        it("detects id rules in CSS", function () {
            var test = require("text!example/css/id.css");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "id",
                    name: "#a",
                    level: 0,
                    line: 0,
                    ch: 0
                }, {
                    type: "id",
                    name: "#a #b",
                    level: 0,
                    line: 1,
                    ch: 0
                }
            ]);
        });

        it("detects attribute rules in CSS", function () {
            var test = require("text!example/css/attribute.css");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "attribute",
                    name: "[name=a]",
                    level: 0,
                    line: 0,
                    ch: 0
                }
            ]);
        });

        it("detects at-rules in CSS", function () {
            var test = require("text!example/css/atrule.css");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "at-rule",
                    name: "@media screen and (min-width: 480px)",
                    level: 0,
                    line: 0,
                    ch: 0
                }, {
                    type: "tag",
                    name: "body",
                    level: 1,
                    line: 1,
                    ch: 4
                }
            ]);
        });

        it("detects comma separated rules in CSS", function () {
            var test = require("text!example/css/comma.css");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "tag",
                    name: "a, b",
                    level: 0,
                    line: 0,
                    ch: 0
                }, {
                    type: "tag",
                    name: "a, b",
                    level: 0,
                    line: 1,
                    ch: 0
                }
            ]);
        });

        it("detects rules with parent selectors in SCSS", function () {
            var test = require("text!example/css/parent.scss");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "tag",
                    name: "a",
                    level: 0,
                    line: 0,
                    ch: 0
                }, {
                    type: "parent",
                    name: "&.b",
                    level: 1,
                    line: 1,
                    ch: 4
                }
            ]);
        });

        it("detects rules with parent selectors in Less", function () {
            var test = require("text!example/css/parent.less");
            var result = Parser.parse(test);
            expect(result).toEqual([
                {
                    type: "tag",
                    name: "a",
                    level: 0,
                    line: 0,
                    ch: 0
                }, {
                    type: "parent",
                    name: "&.b",
                    level: 1,
                    line: 1,
                    ch: 4
                }
            ]);
        });
    });
});
