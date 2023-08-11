/* global module */

module.exports = function (config) {
    "use strict";

    config.set({
        basePath: "",
        singleRun: false,
        frameworks: ["jasmine", "requirejs"],
        hostname: "127.0.0.1",
        browsers: ["Chrome", "jsdom"],
        reporters: ["progress", "coverage"],
        preprocessors: {
            "src/**/*.js": ["coverage"]
        },
        coverageReporter: {
            type: "lcovonly",
            dir: "coverage",
            subdir: "."
        },
        files: [
            {
                pattern: "thirdparty/*.js",
                included: false
            }, {
                pattern: "node_modules/requirejs-text/text.js",
                included: false
            }, {
                pattern: "src/**/*.js",
                included: false
            }, {
                pattern: "test/*Spec.js",
                included: false
            }, {
                pattern: "test/example/**/*",
                included: false
            },
            "test/test-main.js"
        ]
    });
};
