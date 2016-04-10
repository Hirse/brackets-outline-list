/* global module */

module.exports = function (config) {
    "use strict";

    config.set({
        basePath: "",
        singleRun: false,
        frameworks: ["jasmine", "requirejs"],
        browsers: ["Chrome", "PhantomJS"],
        files: [
            {pattern: "thirdparty/*.js", included: false},
            {pattern: "node_modules/text/text.js", included: false},
            {pattern: "src/**/*.js", included: false},
            {pattern: "test/*Spec.js", included: false},
            {pattern: "test/example/**/*", included: false},
            "test/test-main.js"
        ]
    });
};
