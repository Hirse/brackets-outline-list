define(function XMLSpec(require) {
    "use strict";

    var Parser = require("lexers/XMLParser");

    describe("XML Parser", function () {
        it("detects HTML tags", function (done) {
            var test = require("text!example/html/tag.html");
            Parser.parse(test).then(function (result) {
                expect(result).toEqual([
                    {
                        name: "html",
                        namespace: "",
                        level: 0,
                        id: "",
                        class: [],
                        line: 0,
                        ch: 0
                    }, {
                        name: "head",
                        namespace: "",
                        level: 1,
                        id: "",
                        class: [],
                        line: 2,
                        ch: 0
                    }, {
                        name: "title",
                        namespace: "",
                        level: 2,
                        id: "",
                        class: [],
                        line: 3,
                        ch: 4
                    }, {
                        name: "body",
                        namespace: "",
                        level: 1,
                        id: "",
                        class: [],
                        line: 6,
                        ch: 0
                    }, {
                        name: "br",
                        namespace: "",
                        level: 2,
                        id: "",
                        class: [],
                        line: 7,
                        ch: 4
                    }
                ]);
                done();
            });
        });

        it("detects HTML classes", function (done) {
            var test = require("text!example/html/class.html");
            Parser.parse(test).then(function (result) {
                expect(result).toEqual([
                    {
                        name: "div",
                        namespace: "",
                        level: 0,
                        id: "",
                        class: ["kebab-case", "snake_case", "camelCase"],
                        line: 0,
                        ch: 0
                    }
                ]);
                done();
            });
        });

        it("detects HTML ids", function (done) {
            var test = require("text!example/html/id.html");
            Parser.parse(test).then(function (result) {
                expect(result).toEqual([
                    {
                        name: "div",
                        namespace: "",
                        level: 0,
                        id: "elementId",
                        class: [],
                        line: 0,
                        ch: 0
                    }
                ]);
                done();
            });
        });

        it("detects xml namespaces", function (done) {
            var test = require("text!example/html/namespace.xml");
            Parser.parse(test).then(function (result) {
                expect(result).toEqual([
                    {
                        name: "element",
                        namespace: "namespace",
                        level: 0,
                        id: "",
                        class: [],
                        line: 1,
                        ch: 0
                    }
                ]);
                done();
            });
        });

        it("detects html in erb", function (done) {
            var test = require("text!example/html/eruby.erb");
            Parser.parse(test).then(function (result) {
                expect(result).toEqual([
                    {
                        name: "ul",
                        namespace: "",
                        level: 0,
                        id: "",
                        class: [],
                        line: 0,
                        ch: 0
                    }, {
                        name: "li",
                        namespace: "",
                        level: 1,
                        id: "",
                        class: [],
                        line: 2,
                        ch: 4
                    }
                ]);
                done();
            });
        });

        it("ignores commented code", function (done) {
            var test = require("text!example/html/comment.html");
            Parser.parse(test).then(function (result) {
                expect(result).toEqual([]);
                done();
            });
        });

        it("ignores broken HTML", function (done) {
            var test = require("text!example/html/error.html");
            Parser.parse(test).then(function (result) {
                expect(result).toEqual([]);
                done();
            });
        });


        it("detects html in vue", function (done) {
            var test = require("text!example/html/vue.vue");
            Parser.parse(test).then(function (result) {
                expect(result).toEqual([
                    {
                        name: "template",
                        namespace: "",
                        level: 0,
                        id: "",
                        class: [],
                        line: 1,
                        ch: 0
                    }, {
                        name: "div",
                        namespace: "",
                        level: 1,
                        id: "",
                        class: [],
                        line: 2,
                        ch: 4
                    }
                ]);
                done();
            });
        });
    });
});
